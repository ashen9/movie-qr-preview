tar czvf app.tar.gz --exclude=node_modules --exclude=.idea --exclude=.git .
scp app.tar.gz root@47.121.213.128:/app



// 服务器
tar xzvf app.tar.gz