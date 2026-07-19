import yaml from "js-yaml";

let directoryHandle = null; // 确保这个变量在模块作用域内

export async function requestDirectoryAccess() {
  try {
    directoryHandle = await window.showDirectoryPicker();
    return directoryHandle;
  } catch (err) {
    return null;
  }
}
// 获取全量数据 (对应原 GET /api/forge-data)
export const loadAllData = async () => {
  if (!directoryHandle) throw new Error("尚未获取目录访问权限");

  const forgeData = {};

  // 遍历目录
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === "file" && entry.name.endsWith(".yaml")) {
      try {
        const file = await entry.getFile();
        const content = await file.text();
        const parsed = yaml.load(content);

        if (parsed && parsed.id) {
          forgeData[parsed.id] = parsed;
        }
      } catch (err) {
        console.warn(`[解析失败] 文件 ${entry.name} 跳过:`, err.message);
      }
    }
  }
  return forgeData;
};

export const saveEntry = async (id, yamlString) => {
  if (!directoryHandle) throw new Error("尚未获取目录访问权限");

  try {
    const fileHandle = await directoryHandle.getFileHandle(`${id}.yaml`, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(yamlString);
    await writable.close();
    return true;
  } catch (err) {
    console.error("文件系统保存失败:", err);
    return false;
  }
};
