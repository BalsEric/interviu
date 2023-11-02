import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { createGroup, createUser, deleteGroup, deleteUser, getAllDataHierarchicalStructured, getAllUsersUnderAGroup, getGroupById, getGroupHierarchyForUser, getGroups, getUserById, getUsers, moveGroupToGroup, moveUserToGroup, updateGroup, updateUser } from './service';
import bodyParser = require('body-parser');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const redis = require('redis');
const client = redis.createClient();

client.on('error', (err:any) => {
    console.error('Redis Error:', err);
  });
  
process.on('beforeExit', () => {
    client.flushall('ASYNC',function (err: any, succeeded: any) {
        console.log("flushed");
    });
    client.quit();
});
  
app.use(async (req: Request, res: Response, next: any) => {
    res.locals.client = client;
    next();
});

//get all data structurec hierarchically
app.get("/all", async (req: Request, res: Response) => {
    try {
        const data = await getAllDataHierarchicalStructured(res.locals.client);
        res.status(200).json(data);
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

//get breadcrumb group for a user 
app.get("/users/:id/groups", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await getUserById(Number(id));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const groups = await getGroupHierarchyForUser(Number(id));
        res.status(200).json(groups);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

//get all users under a group and all sub-groups
app.get("/groups/:id/users", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { jobTitle, firstName } = req.query;
        const group = await getGroupById(Number(id));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        const users = await getAllUsersUnderAGroup(Number(id), jobTitle as string, firstName as string);
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// create a new user
app.post('/users', async (req: Request, res: Response) => {
    try {
        const { body } = req;
        if (!body.firstName || !body.lastName || !body.jobTitle)   {
            return res.status(400).json({ error: 'Missing required fields: firstName, lastName, jobTitle' });
        }
        const user = await createUser(body);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// get all users
app.get('/users', async (req: Request, res: Response) => {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// get user by id
app.get('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await getUserById(Number(id));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// update user by id
app.put('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const user = await updateUser(Number(id), body);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// delete user by id
app.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await getUserById(Number(id));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await deleteUser(Number(id));
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// create a new group
app.post('/groups', async (req: Request, res: Response) => {
    try {
        const { body } = req;
        if (!body.name) {
            return res.status(400).json({ error: 'Missing required fields: name' });
        }
        const group = await createGroup(body);
        res.status(201).json(group);
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// get all groups
app.get('/groups', async (req: Request, res: Response) => {
    try {
        const groups = await getGroups();
        res.status(200).json(groups);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// get group by id
app.get('/groups/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const group = await getGroupById(Number(id));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.status(200).json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// update group by id
app.put('/groups/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const group = await updateGroup(Number(id), body);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.status(200).json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// delete group by id
app.delete('/groups/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const group = await getGroupById(Number(id));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        await deleteGroup(Number(id));
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// add/move user to group
app.patch('/users/:userId/groups/:groupId', async (req: Request, res: Response) => {
    try {
        const { userId, groupId } = req.params;
        const user = await getUserById(Number(userId));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const group = await getGroupById(Number(groupId));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        await moveUserToGroup(Number(userId), Number(groupId));
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// add/move group to group
app.patch('/groups/:groupId/groups/:parentId', async (req: Request, res: Response) => {
    try {
        const { groupId, parentId } = req.params;
        const group = await getGroupById(Number(groupId));
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        const parentGroup = await getGroupById(Number(parentId));
        if (!parentGroup) {
            return res.status(404).json({ error: 'Parent group not found' });
        }
        await moveGroupToGroup(Number(groupId), Number(parentId));
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
  
app.listen(port, async () => {
    await client.connect();
    client.flushall('ASYNC',function (err: any, succeeded: any) {
        console.log("flushed");
    });
    console.log(`Server running at http://localhost:${port}`);
  });