// 部署配置文件
export default {
  // 生产环境配置
  production: {
    // 服务器连接配置
    server: {
      host: '43.138.234.29',
      port: 22,
      username: 'root', // 请根据实际情况修改用户名
      // password: 'your-password', // 密码方式（不推荐）
      // privateKey: require('fs').readFileSync('/path/to/private/key'), // 私钥方式（推荐）
    },
    
    // 本地构建配置
    local: {
      buildCommand: 'npm run build',
      buildDir: 'dist',
      zipFileName: 'apex-admin-dist.zip'
    },
    
    // 远程服务器配置
    remote: {
      // 上传到服务器的临时目录
      uploadPath: '/tmp/apex-admin-dist.zip',
      // 网站部署目录
      deployPath: '/var/www/apex-admin',
      // 备份目录
      backupPath: '/var/www/backup/apex-admin',
      // Nginx配置文件路径（如果需要）
      nginxConfigPath: '/etc/nginx/sites-available/apex-admin',
      // 服务端口
      serverPort: 8888
    },
    
    // 部署前后执行的命令
    commands: {
      // 部署前在服务器执行的命令
      beforeDeploy: [
        // 创建备份
        'mkdir -p /var/www/backup/apex-admin',
        `cp -r /var/www/apex-admin /var/www/backup/apex-admin/backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "No existing deployment to backup"`
      ],
      
      // 部署时执行的命令
      deploy: [
        // 创建部署目录
        'mkdir -p /var/www/apex-admin',
        // 解压文件
        'cd /var/www && unzip -o /tmp/apex-admin-dist.zip -d apex-admin',
        // 设置权限
        'chown -R www-data:www-data /var/www/apex-admin',
        'chmod -R 755 /var/www/apex-admin'
      ],
      
      // 部署后执行的命令
      afterDeploy: [
        // 清理临时文件
        'rm -f /tmp/apex-admin-dist.zip',
        // 重启Nginx（如果需要）
        // 'systemctl reload nginx'
      ]
    }
  },
  
  // 测试环境配置（可选）
  staging: {
    server: {
      host: '43.138.234.29',
      port: 22,
      username: 'root',
    },
    local: {
      buildCommand: 'npm run build',
      buildDir: 'dist',
      zipFileName: 'apex-admin-staging.zip'
    },
    remote: {
      uploadPath: '/tmp/apex-admin-staging.zip',
      deployPath: '/var/www/apex-admin-staging',
      backupPath: '/var/www/backup/apex-admin-staging',
      serverPort: 8889
    }
  }
}
