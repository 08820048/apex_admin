# 部署说明文档

## 🚀 快速部署

### 1. 环境准备

#### 本地环境
- Node.js >= 16
- npm >= 8

#### 服务器环境
- Ubuntu/CentOS Linux
- Nginx
- SSH访问权限

### 2. 配置服务器连接

编辑 `deploy.config.js` 文件，配置服务器连接信息：

```javascript
server: {
  host: '43.138.234.29',
  port: 22,
  username: 'root',
  // 选择一种认证方式：
  password: 'your-password', // 密码认证（不推荐）
  // 或
  privateKey: require('fs').readFileSync('/path/to/private/key'), // 私钥认证（推荐）
}
```

### 3. 部署命令

```bash
# 部署到生产环境
npm run deploy

# 部署到测试环境
npm run deploy:staging

# 仅构建（不部署）
npm run build:prod
```

### 4. 部署流程

部署脚本会自动执行以下步骤：

1. **构建项目** - 执行 `npm run build`
2. **压缩文件** - 将构建文件打包成zip
3. **上传文件** - 通过SSH上传到服务器
4. **备份旧版本** - 自动备份当前版本
5. **解压部署** - 解压新版本到部署目录
6. **设置权限** - 配置文件权限
7. **清理临时文件** - 删除临时文件

### 5. 服务器配置

#### 5.1 创建部署目录

```bash
sudo mkdir -p /var/www/apex-admin
sudo mkdir -p /var/www/backup/apex-admin
sudo chown -R www-data:www-data /var/www/apex-admin
```

#### 5.2 配置Nginx

```bash
# 复制Nginx配置
sudo cp nginx.conf.template /etc/nginx/sites-available/apex-admin

# 启用站点
sudo ln -s /etc/nginx/sites-available/apex-admin /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

#### 5.3 防火墙配置

```bash
# 开放8888端口
sudo ufw allow 8888
```

### 6. 环境变量配置

#### 6.1 生产环境 (`.env.production`)

```env
NODE_ENV=production
VITE_API_BASE_URL=http://43.138.234.29:8888/api
VITE_APP_TITLE=Apex Blog 管理后台
VITE_USE_MOCK=false
VITE_DEBUG=false
VITE_BUILD_SOURCEMAP=false
```

### 7. 故障排除

#### 7.1 SSH连接失败
- 检查服务器IP和端口
- 确认SSH服务运行状态
- 验证用户名和密码/私钥

#### 7.2 权限问题
```bash
# 修复文件权限
sudo chown -R www-data:www-data /var/www/apex-admin
sudo chmod -R 755 /var/www/apex-admin
```

#### 7.3 Nginx配置问题
```bash
# 检查Nginx配置
sudo nginx -t

# 查看Nginx日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/apex-admin.error.log
```

#### 7.4 API连接问题
- 检查后端API服务状态
- 确认API地址配置正确
- 检查防火墙设置

### 8. 监控和维护

#### 8.1 查看部署日志
```bash
# 查看Nginx访问日志
sudo tail -f /var/log/nginx/apex-admin.access.log

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/apex-admin.error.log
```

#### 8.2 备份管理
```bash
# 查看备份
ls -la /var/www/backup/apex-admin/

# 手动备份
sudo cp -r /var/www/apex-admin /var/www/backup/apex-admin/manual-backup-$(date +%Y%m%d-%H%M%S)
```

#### 8.3 回滚部署
```bash
# 查看可用备份
ls /var/www/backup/apex-admin/

# 回滚到指定版本
sudo cp -r /var/www/backup/apex-admin/backup-20231201-143000/* /var/www/apex-admin/
sudo systemctl reload nginx
```

### 9. 安全建议

1. **使用SSH密钥认证**而不是密码
2. **定期更新服务器**系统和软件
3. **配置防火墙**只开放必要端口
4. **启用HTTPS**（推荐使用Let's Encrypt）
5. **定期备份**重要数据

### 10. 性能优化

1. **启用Gzip压缩**（已在Nginx配置中）
2. **配置静态资源缓存**（已在Nginx配置中）
3. **使用CDN**加速静态资源
4. **监控服务器性能**

## 📞 技术支持

如果在部署过程中遇到问题，请检查：

1. 服务器连接配置
2. 网络连接状态
3. 服务器权限设置
4. Nginx配置文件
5. 防火墙设置

部署成功后，访问：http://43.138.234.29:8888
