# README
###大文件断点上传
#### 前端
- 上传 + 中断上传功能;
- 需要上传切片的 index;
- 断网后续传: 需要监听网络情况, 网络连接后调用接口获取已上传片段的大小;
- 多片段同时上传;
#### 后端接收
- /upload 所需参数: 
```typescript
interface Params {
  filename: string;
  index: string;
  totalChunks: string;
  chunk: Buffer;
}
```
- 通过 stream 的形式写入文件;
- 根据 index 创建对应的分片文件;
- 全部分片上传完成后整理合并为一个大文件, 并删除切片文件;
