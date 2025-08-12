<template>
  <div class="markdown-preview">
    <v-md-preview 
      :text="content" 
      :height="height"
      class="preview-content"
    />
  </div>
</template>

<script setup>
// Markdown预览组件
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '300px'
  }
})
</script>

<style scoped>
.markdown-preview {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.preview-content {
  background-color: #fff;
}

/* 自定义预览样式 */
.preview-content :deep(.v-md-editor-preview) {
  padding: 16px;
}

.preview-content :deep(.v-md-editor-preview h1),
.preview-content :deep(.v-md-editor-preview h2),
.preview-content :deep(.v-md-editor-preview h3) {
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content :deep(.v-md-editor-preview p) {
  margin-bottom: 12px;
  line-height: 1.6;
}

.preview-content :deep(.v-md-editor-preview code) {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

.preview-content :deep(.v-md-editor-preview pre) {
  background-color: #f8f8f8;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
}

.preview-content :deep(.v-md-editor-preview blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 16px 0;
  color: #666;
}

.preview-content :deep(.v-md-editor-preview table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.preview-content :deep(.v-md-editor-preview table th),
.preview-content :deep(.v-md-editor-preview table td) {
  border: 1px solid #e4e7ed;
  padding: 8px 12px;
  text-align: left;
}

.preview-content :deep(.v-md-editor-preview table th) {
  background-color: #f5f7fa;
  font-weight: 600;
}
</style>
