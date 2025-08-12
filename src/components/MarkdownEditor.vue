<template>
  <div class="markdown-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <el-button-group>
        <el-button size="small" @click="insertText('**', '**')" title="粗体">
          <strong>B</strong>
        </el-button>
        <el-button size="small" @click="insertText('*', '*')" title="斜体">
          <em>I</em>
        </el-button>
        <el-button size="small" @click="insertText('# ', '')" title="标题1">H1</el-button>
        <el-button size="small" @click="insertText('## ', '')" title="标题2">H2</el-button>
        <el-button size="small" @click="insertText('### ', '')" title="标题3">H3</el-button>
      </el-button-group>
      <el-button-group>
        <el-button size="small" @click="insertText('- ', '')" title="无序列表">列表</el-button>
        <el-button size="small" @click="insertText('1. ', '')" title="有序列表">序号</el-button>
        <el-button size="small" @click="insertText('> ', '')" title="引用">引用</el-button>
        <el-button size="small" @click="insertText('`', '`')" title="行内代码">代码</el-button>
      </el-button-group>
      <el-button-group>
        <el-button size="small" @click="insertText('[链接文字](', ')')" title="插入链接">链接</el-button>
        <el-button size="small" @click="insertText('![图片描述](', ')')" title="插入图片">图片</el-button>
        <el-button size="small" @click="insertText('```\n', '\n```')" title="代码块">代码块</el-button>
        <el-button size="small" @click="insertText('---\n', '')" title="分割线">分割线</el-button>
      </el-button-group>
      <div class="toolbar-right">
        <el-button size="small" @click="togglePreview" :type="showPreview ? 'primary' : ''">
          {{ showPreview ? '隐藏预览' : '显示预览' }}
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body" :class="{ 'split-view': showPreview }">
      <!-- 编辑区域 -->
      <div class="editor-pane">
        <el-input
          ref="textareaRef"
          v-model="localValue"
          type="textarea"
          placeholder="请输入Markdown内容..."
          class="markdown-textarea"
          @input="handleInput"
          resize="none"
        />
      </div>

      <!-- 预览区域 -->
      <div v-if="showPreview" class="preview-pane">
        <div class="preview-header">
          <span class="preview-title">实时预览</span>
        </div>
        <div class="preview-container" v-html="renderedMarkdown"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '500px'
  }
})

const emit = defineEmits(['update:modelValue'])

const textareaRef = ref()
const localValue = ref(props.modelValue)
const showPreview = ref(true) // 默认显示预览

// 配置marked
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    return `<pre><code class="language-${lang}">${code}</code></pre>`
  }
})

// 渲染Markdown
const renderedMarkdown = computed(() => {
  if (!localValue.value) return '<p class="empty-content">暂无内容</p>'
  return marked(localValue.value)
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// 处理输入
const handleInput = () => {
  emit('update:modelValue', localValue.value)
}

// 切换预览
const togglePreview = () => {
  showPreview.value = !showPreview.value
}

// 插入文本
const insertText = async (before, after = '') => {
  await nextTick()
  const textarea = textareaRef.value?.textarea || textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = localValue.value.substring(start, end)
  
  const newText = before + selectedText + after
  const newValue = localValue.value.substring(0, start) + newText + localValue.value.substring(end)
  
  localValue.value = newValue
  emit('update:modelValue', newValue)
  
  // 重新设置光标位置
  await nextTick()
  const newCursorPos = start + before.length + selectedText.length
  textarea.focus()
  textarea.setSelectionRange(newCursorPos, newCursorPos)
}
</script>

<style scoped>
.markdown-editor {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.editor-toolbar {
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar-right {
  margin-left: auto;
}

.editor-body {
  display: flex;
  height: 500px;
}

.editor-body.split-view .editor-pane {
  width: 50%;
  border-right: 1px solid #e4e7ed;
}

.editor-body:not(.split-view) .editor-pane {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-body.split-view {
    flex-direction: column;
    height: auto;
  }

  .editor-body.split-view .editor-pane {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }

  .preview-pane {
    width: 100% !important;
    height: 300px;
  }
}

.editor-pane {
  display: flex;
  flex-direction: column;
}

.preview-pane {
  width: 50%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.preview-header {
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 12px;
  color: #666;
}

.preview-title {
  font-weight: 500;
}

.markdown-textarea {
  flex: 1;
  border: none;
}

.markdown-textarea :deep(.el-textarea__inner) {
  border: none;
  border-radius: 0;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  height: 100% !important;
  min-height: auto !important;
}

.preview-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #fff;
}

.empty-content {
  color: #999;
  text-align: center;
  margin-top: 100px;
}

/* Markdown预览样式 */
.preview-container :deep(h1),
.preview-container :deep(h2),
.preview-container :deep(h3),
.preview-container :deep(h4),
.preview-container :deep(h5),
.preview-container :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.preview-container :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 10px;
}

.preview-container :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 8px;
}

.preview-container :deep(p) {
  margin-bottom: 16px;
  line-height: 1.6;
}

.preview-container :deep(code) {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.preview-container :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
}

.preview-container :deep(pre code) {
  background: none;
  padding: 0;
}

.preview-container :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  margin: 16px 0;
  color: #6a737d;
}

.preview-container :deep(ul),
.preview-container :deep(ol) {
  padding-left: 24px;
  margin-bottom: 16px;
}

.preview-container :deep(li) {
  margin-bottom: 4px;
}

.preview-container :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.preview-container :deep(table th),
.preview-container :deep(table td) {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
  text-align: left;
}

.preview-container :deep(table th) {
  background: #f6f8fa;
  font-weight: 600;
}

.preview-container :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
}

.preview-container :deep(hr) {
  border: none;
  border-top: 1px solid #eaecef;
  margin: 24px 0;
}
</style>
