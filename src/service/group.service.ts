import { getUsersByGroup } from "./user.service";

const db = require("../db");
const moment = require("moment");

export const createGroup = async (data: any) => {
    const now = moment();
    const group = await db.query(
        "INSERT INTO groups (name, parentGroupId, createdAt, updatedAt) VALUES ($1, $2, $3, $4) RETURNING *",
        [data.name, data?.parentGroupId, now, now]
    );
    return group.rows[0];
}

export const getGroupById = async (id: number) => {
    const group = await db.query("SELECT * FROM groups WHERE id = $1", [id]);
    return group.rows[0];
}

export const updateGroup = async (id: number, data: any) => {
    const now = moment();

    const fieldsToUpdate: string[] = [];
    Object.keys(data).forEach((key) => {
        fieldsToUpdate.push(`${key} = ${data[key]},`);
    });

    const group = await db.query(
        `UPDATE groups SET ${fieldsToUpdate.join(" ")} updatedAt = $1 WHERE id = $2 RETURNING *`,
        [now, id]
    );

    return group.rows[0];
}

export const deleteGroup = async (id: number) => {
    await db.query("DELETE FROM groups WHERE id = $1", [id]);
}

export const getGroups = async () => {
    const groups = await db.query("SELECT * FROM groups");
    return groups.rows;
}

export const moveGroupToGroup = async (groupId: number, parentId: number) => {
    const updatedGroup = await updateGroup(groupId, { parentGroupId: parentId});
    return updatedGroup;
}

export const getAllUsersUnderAGroup = async (groupId: number, jobTitle: string, firstName: string) => {
    const group = await getGroupById(groupId);
    if (!group) {
        console.log('Group not found: ', groupId)
        return [];
    }

    const query = `SELECT * FROM users WHERE groupId = ${groupId} ${jobTitle && firstName ? `AND (jobTitle = ${jobTitle} OR firstName = $firstName)`: jobTitle && !firstName ? `AND jobTitle = ${jobTitle}` : !jobTitle && firstName ? `AND firstName = ${firstName}` : ""}`;
    const users = await db.query(query);
    const childGroups = await db.query("SELECT * FROM groups WHERE parentGroupId = $1", [groupId]);

    const childUsers = await Promise.all(childGroups.rows.map(async (group: any) => await getAllUsersUnderAGroup(group.id, jobTitle, firstName)));
    return [...users.rows, ...childUsers].flat();
}

export const getAllDataHierarchicalStructured = async (client: any, parentGroupId?: number) => {
    if (!parentGroupId) {
        // const cacheKey = `data:${parentGroupId || 'root'}`;
        // const cachedData = await client.get(cacheKey);
        // if (cachedData) {
        //     console.log('Data fetched from cache', cachedData)
        //     return JSON.parse(cachedData);
        // }
        
        const rootLevelGroups = await db.query("SELECT * FROM groups WHERE parentGroupId IS NULL");
        const response = await Promise.all(rootLevelGroups.rows.map(async (group: any) => {
            return {
                ...group,
                groupData: {
                    ...await getAllDataHierarchicalStructured(client, group.id),
                    users: await getUsersByGroup(group.id)
                }
            }
        }));
        // await Promise.all((response.map((group: any) => {
        //     client.json.set(`group:${parentGroupId}-${group.id}`, '$', response);
        // })));
        return response;
    }
    const childGroups = await db.query("SELECT * FROM groups WHERE parentGroupId = $1", [parentGroupId]);
    if (!childGroups.rows.length) {
        console.log('Childs Groups not found: ', parentGroupId)
        return [];
    }
    const response = await Promise.all(childGroups.rows.map(async (group: any) => {
        return {
            ...group,
            groupData: {
                ...await getAllDataHierarchicalStructured(client, group.id),
                users: await getUsersByGroup(group.id)
            }
        }
    }));
    
    return response;
}