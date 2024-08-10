// Middleware for posting
app.post('/post', uploadMiddleware.single('file'), async (req, res) =>{
    try {
        const {originalname, path} = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length-1];
        const newPath = `${path}.${ext}`;
        await fs.promises.rename(path, newPath);  // Use promises to avoid blocking

        const {token} = req.cookies;
        jwt.verify(token, secret, async (err, info) => {
            if(err) return res.status(401).json('Invalid token');

            const {title, summary, content} = req.body;
            const postDoc = await Post.create({
                title,
                summary,
                content,
                cover: newPath,
                author: info.id,
            });

            res.json(postDoc);
        });
    } catch (error) {
        res.status(500).json('Server error');
    }
});

// Middleware for updating
app.put('/post', uploadMiddleware.single('file'), async(req, res) => {
    try {
        let newPath = null;
        if(req.file){
            const {originalname, path} = req.file;
            const parts = originalname.split('.');
            const ext = parts[parts.length-1];
            newPath = `${path}.${ext}`;
            await fs.promises.rename(path, newPath);  // Use promises to avoid blocking
        }

        const {token} = req.cookies;
        jwt.verify(token, secret, async (err, info) => {
            if(err) return res.status(401).json('Invalid token');

            const {id, title, summary, content} = req.body;
            const postDoc = await Post.findById(id);
            const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);

            if(!isAuthor) {
                return res.status(400).json('You are not the author');
            }

            postDoc.title = title;
            postDoc.summary = summary;
            postDoc.content = content;
            if (newPath) postDoc.cover = newPath;

            await postDoc.save();  // Save the document

            res.json(postDoc);
        });
    } catch (error) {
        res.status(500).json('Server error');
    }
});
