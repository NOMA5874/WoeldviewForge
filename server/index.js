import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");

const app = express();
app.use(cors());
app.use(express.json());

// 确保底座目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, {recursive: true});

// [契约接口] 获取全量数据 (平铺式遍历)
app.get("/api/forge-data", (req, res) => {
  try {
    // 1. 防御性检查：确保目录存在，避免 ENOENT 错误
    if (!fs.existsSync(DATA_DIR)) {
      console.warn(`[警告] 数据目录不存在，系统将自动创建: ${DATA_DIR}`);
      fs.mkdirSync(DATA_DIR, {recursive: true});
      return res.json({success: true, data: {}});
    }

    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".yaml"));
    const forgeData = {};

    files.forEach((file) => {
      // 2. 单文件隔离区：将读取和解析放在独立的 try-catch 中
      try {
        const content = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
        const parsed = yaml.load(content);

        if (parsed && parsed.id) {
          forgeData[parsed.id] = parsed;
        } else {
          console.warn(`[格式警告] 文件 ${file} 缺失 id 字段或为空，已跳过。`);
        }
      } catch (fileError) {
        // 3. 精准定位：如果某个文件解析失败，终端会立刻打印出凶手！
        console.error(`❌ [解析失败] 无法加载文件 ${file}，错误信息:`, fileError.message);
        // 跳过这个损坏的文件，继续执行下一个
      }
    });

    res.json({success: true, data: forgeData});
  } catch (error) {
    // 4. 恢复终端发声：捕获其他系统级严重错误并打印
    console.error("💥 [系统错误] /api/forge-data 接口崩溃:", error);
    res.status(500).json({success: false, message: error.message});
  }
});

// [契约接口] 数据落盘保存
app.post("/api/save-entry", (req, res) => {
  const {id, content} = req.body;
  if (!id || !content) return res.status(400).json({success: false, message: "Missing id or content"});

  try {
    const filePath = path.join(DATA_DIR, `${id}.yaml`);
    fs.writeFileSync(filePath, content, "utf8");
    res.json({success: true});
  } catch (error) {
    res.status(500).json({success: false, message: error.message});
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌌 后端 I/O 引擎已启动于端口 ${PORT}`);
});
