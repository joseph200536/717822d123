const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 5000;

const token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQyNjI3OTIzLCJpYXQiOjE3NDI2Mjc2MjMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijc5OGQyMTFlLWY1MzgtNGIwMy1hNDhjLWQyYmU1NzBmZmFjOSIsInN1YiI6IjcxNzgyMmQxMjNAa2NlLmFjLmluIn0sImNvbXBhbnlOYW1lIjoiak1hcnQiLCJjbGllbnRJRCI6Ijc5OGQyMTFlLWY1MzgtNGIwMy1hNDhjLWQyYmU1NzBmZmFjOSIsImNsaWVudFNlY3JldCI6ImVTT0dLTUNrdnB3dkxveG0iLCJvd25lck5hbWUiOiJKb3NlcGgiLCJvd25lckVtYWlsIjoiNzE3ODIyZDEyM0BrY2UuYWMuaW4iLCJyb2xsTm8iOiI3MTc4MjJkMTIzIn0.2qUsK_Z43suD4Ap-o5OkIAZXrLehfMCNZNb9X5P-3Og"

async function getUsers() {
    const response = await axios.get('http://20.244.56.144/test/users',{headers:{Authorization: `Bearer ${token}`}});
    return response.data.users;
}


async function getPosts(userId) {
    const response = await axios.get(`http://20.244.56.144/test/users/${userId}/posts`,{headers:{Authorization: `Bearer ${token}`}});
    return response.data.posts;
}

async function getComments(postId) {
    const response = await axios.get(`http://20.244.56.144/test/posts/${postId}/comments`,{headers:{Authorization: `Bearer ${token}`}});
    return response.data.comments;
}

app.get('/users', async (req, res) => {
    try {
        const users = await getUsers();
        const userPostCounts = await Promise.all(
            Object.keys(users).map(async (userId) => {
                const posts = await getPosts(userId);
                return { userId, name: users[userId], postCount: posts.length };
            })
        );


        const topUsers = userPostCounts.sort((a, b) => b.postCount - a.postCount).slice(0, 5);
        res.json(topUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch top users' });
    }
});


app.get('/posts/latest', async (req, res) => {
    try {
        const users = await getUsers();
        let allPosts = [];

        for (const userId of Object.keys(users)) {
            const userPosts = await getPosts(userId);
            allPosts = allPosts.concat(userPosts);
        }
        const sortedPosts = allPosts.sort((a, b) => b.id - a.id);

        
        const latestPost = sortedPosts[0]; 
        res.json(latestPost);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch latest post' });
    }
});

app.get('/posts/popular', async (req, res) => {
    try {
        const users = await getUsers();
        let allPosts = [];
        for (const userId of Object.keys(users)) {
            const userPosts = await getPosts(userId);
            allPosts = allPosts.concat(userPosts);
        }
        const postsWithCommentCounts = await Promise.all(
            allPosts.map(async (post) => {
                const comments = await getComments(post.id);
                return { ...post, commentCount: comments.length };
            })
        );
        const maxComments = Math.max(...postsWithCommentCounts.map(p => p.commentCount));
        const popularPosts = postsWithCommentCounts.filter(p => p.commentCount === maxComments);
        res.json(popularPosts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch popular posts' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});