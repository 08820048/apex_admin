#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import archiver from 'archiver'
import { Client } from 'ssh2'
import deployConfig from '../deploy.config.js'

class Deployer {
  constructor(environment = 'production') {
    this.config = deployConfig[environment]
    if (!this.config) {
      throw new Error(`Environment "${environment}" not found in deploy config`)
    }
    this.environment = environment
  }

  // 执行本地构建
  async build() {
    console.log('🔨 开始构建项目...')
    try {
      execSync(this.config.local.buildCommand, { stdio: 'inherit' })
      console.log('✅ 项目构建完成')
    } catch (error) {
      console.error('❌ 构建失败:', error.message)
      process.exit(1)
    }
  }

  // 压缩构建文件
  async compress() {
    console.log('📦 开始压缩构建文件...')
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(this.config.local.zipFileName)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        console.log(`✅ 压缩完成，文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
        resolve()
      })

      archive.on('error', (err) => {
        console.error('❌ 压缩失败:', err)
        reject(err)
      })

      archive.pipe(output)
      archive.directory(this.config.local.buildDir, false)
      archive.finalize()
    })
  }

  // 上传文件到服务器
  async upload() {
    console.log('📤 开始上传文件到服务器...')
    
    return new Promise((resolve, reject) => {
      const conn = new Client()
      
      conn.on('ready', () => {
        console.log('🔗 SSH连接成功')
        
        conn.sftp((err, sftp) => {
          if (err) {
            console.error('❌ SFTP连接失败:', err)
            reject(err)
            return
          }

          const localFile = this.config.local.zipFileName
          const remoteFile = this.config.remote.uploadPath

          sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) {
              console.error('❌ 文件上传失败:', err)
              reject(err)
            } else {
              console.log('✅ 文件上传成功')
              resolve()
            }
            conn.end()
          })
        })
      })

      conn.on('error', (err) => {
        console.error('❌ SSH连接失败:', err)
        reject(err)
      })

      conn.connect(this.config.server)
    })
  }

  // 在服务器上执行命令
  async executeCommands(commands, description) {
    if (!commands || commands.length === 0) return

    console.log(`🚀 ${description}...`)
    
    return new Promise((resolve, reject) => {
      const conn = new Client()
      
      conn.on('ready', () => {
        const executeCommand = (index) => {
          if (index >= commands.length) {
            console.log(`✅ ${description}完成`)
            conn.end()
            resolve()
            return
          }

          const command = commands[index]
          console.log(`   执行: ${command}`)
          
          conn.exec(command, (err, stream) => {
            if (err) {
              console.error(`❌ 命令执行失败: ${command}`, err)
              reject(err)
              return
            }

            stream.on('close', (code) => {
              if (code !== 0) {
                console.warn(`⚠️  命令退出码: ${code} - ${command}`)
              }
              executeCommand(index + 1)
            })

            stream.on('data', (data) => {
              console.log(`   输出: ${data.toString().trim()}`)
            })

            stream.stderr.on('data', (data) => {
              console.warn(`   错误: ${data.toString().trim()}`)
            })
          })
        }

        executeCommand(0)
      })

      conn.on('error', (err) => {
        console.error('❌ SSH连接失败:', err)
        reject(err)
      })

      conn.connect(this.config.server)
    })
  }

  // 清理本地文件
  cleanup() {
    console.log('🧹 清理本地临时文件...')
    try {
      if (fs.existsSync(this.config.local.zipFileName)) {
        fs.unlinkSync(this.config.local.zipFileName)
        console.log('✅ 本地临时文件清理完成')
      }
    } catch (error) {
      console.warn('⚠️  清理本地文件失败:', error.message)
    }
  }

  // 执行完整部署流程
  async deploy() {
    const startTime = Date.now()
    console.log(`🚀 开始部署到 ${this.environment} 环境...`)
    console.log(`📍 目标服务器: ${this.config.server.host}:${this.config.remote.serverPort}`)
    
    try {
      // 1. 构建项目
      await this.build()
      
      // 2. 压缩文件
      await this.compress()
      
      // 3. 上传文件
      await this.upload()
      
      // 4. 执行部署前命令
      await this.executeCommands(this.config.commands.beforeDeploy, '执行部署前命令')
      
      // 5. 执行部署命令
      await this.executeCommands(this.config.commands.deploy, '执行部署命令')
      
      // 6. 执行部署后命令
      await this.executeCommands(this.config.commands.afterDeploy, '执行部署后命令')
      
      // 7. 清理本地文件
      this.cleanup()
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`🎉 部署成功完成！耗时: ${duration}s`)
      console.log(`🌐 访问地址: http://${this.config.server.host}:${this.config.remote.serverPort}`)
      
    } catch (error) {
      console.error('❌ 部署失败:', error.message)
      this.cleanup()
      process.exit(1)
    }
  }
}

// 命令行参数处理
const args = process.argv.slice(2)
const environment = args[0] || 'production'

// 创建部署器并执行部署
const deployer = new Deployer(environment)
deployer.deploy()
