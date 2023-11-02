import { getGroupById } from "./group.service";

const db = require("../db");
const moment = require("moment");

export const createUser = async (data: any) => {
    const now = moment();
    const user = await db.query(
        "INSERT INTO users (firstName, lastName, jobTitle, groupId, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [data.firstName, data.lastName, data.jobTitle, data?.groupId, now, now]
    );
    return user.rows[0];
}

export const getUserById = async (id: number) => {
    const user = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return user.rows[0];
}

export const updateUser = async (id: number, data: any) => {
    const now = moment();

    const fieldsToUpdate: string[] = [];
    Object.keys(data).forEach((key) => {
        fieldsToUpdate.push(`${key} = ${data[key]},`);
    });

    const user = await db.query(
        `UPDATE users SET ${fieldsToUpdate.join(" ")} updatedAt = $1 WHERE id = $2 RETURNING *`,
        [now, id]
    );
    return user.rows[0];
}

export const deleteUser = async (id: number) => {
    await db.query("DELETE FROM users WHERE id = $1", [id]);
}

export const getUsers = async () => {
    const users = await db.query("SELECT * FROM users");
    return users.rows;
}

export const moveUserToGroup = async (userId: number, groupId: number) => {
    const now = moment();
    const user = await db.query(
        "UPDATE users SET groupId = $1, updatedAt = $2 WHERE id = $3 RETURNING *",
        [groupId, now, userId]
    );
    return user.rows[0];
}

export const getUsersByGroup = async (groupId: number) => {
    const users = await db.query("SELECT * FROM users WHERE groupId = $1", [groupId]);
    return users.rows;
}

export const getGroupHierarchy = async (groupId: number) => {
    const group = await getGroupById(groupId);
    if (!group) {
        throw new Error('User is not in a group');
    }
    const groups = [group];

    let parentGroupId = group.parentgroupid;
    while (parentGroupId) {
        const higherGroup = await getGroupById(parentGroupId);
        if (!higherGroup?.parentgroupid) {
            groups.unshift(higherGroup);
            console.log('Reached top level group:', parentGroupId)
            break;
        }
        parentGroupId = higherGroup.parentgroupid;
        groups.unshift(higherGroup);
    }
    return groups;
}

export const getGroupHierarchyForUser = async (userId: number) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const groups = await getGroupHierarchy(user.groupid);
    const groupNames = groups.map((group: any) => group.name).join(' > ');
    return groupNames;
}