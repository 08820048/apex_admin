<template>
  <div class="markdown-editor">
    <el-tabs v-model="activeTab" class="editor-tabs">
      <el-tab-pane label="编辑" name="edit">
        <div class="editor-container">
          <div class="editor-toolbar">
            <el-button-group>
              <el-button size="small" @click="insertText('**', '**')">
                <strong>B</strong>
              </el-button>
              <el-button size="small" @click="insertText('*', '*')">
                <em>I</em>
              </el-button>
              <el-button size="small" @click="insertText('# ', '')">H1</el-button>
              <el-button size="small" @click="insertText('## ', '')">H2</el-button>
              <el-button size="small" @click="insertText('### ', '')">H3</el-button>
            </el-button-group>
            <el-button-group>
              <el-button size="small" @click="insertText('- ', '')">列表</el-button>
              <el-button size="small" @click="insertText('1. ', '')">序号</el-button>
              <el-button size="small" @click="insertText('> ', '')">引用</el-button>
              <el-button size="small" @click="insertText('`', '`')">代码</el-button>
            </el-button-group>
            <el-button-group>
              <el-button size="small" @click="insertText('[链接文字](', ')')">链接</el-button>
              <el-button size="small" @click="insertText('![图片描述](', ')')">图片</el-button>
              <el-button size="small" @click="insertText('```\n', '\n```')">代码块</el-button>
            </el-button-group>
          </div>
          <el-input
            ref="textareaRef"
            v-model="localValue"
            type="textarea"
            :rows="20"
            placeholder="请输入Markdown内容..."
            class="markdown-textarea"
            @input="handleInput"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane label="预览" name="preview">
        <div class="preview-container" v-html="renderedMarkdown"></div>
      </el-tab-pane>
    </el-tabs>
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

const activeTab = ref('edit')
const textareaRef = ref()
const localValue = ref(props.modelValue)

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
}

.editor-tabs :deep(.el-tabs__content) {
  padding: 0;
}

.editor-container {
  background: #fff;
}

.editor-toolbar {
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.markdown-textarea {
  border: none;
}

.markdown-textarea :deep(.el-textarea__inner) {
  border: none;
  border-radius: 0;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.preview-container {
  padding: 20px;
  min-height: 400px;
  background: #fff;
  overflow-y: auto;
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
