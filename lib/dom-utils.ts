/**
 * DOM工具函数 - 安全操作DOM节点
 */

/**
 * 检查节点是否有效且存在于DOM中
 */
export function isValidNode(node: Node | null): node is Node {
  if (!node) return false;

  try {
    // 检查节点是否仍在DOM中
    return document.contains(node);
  } catch (error) {
    console.error("isValidNode: 检查节点时发生错误", error);
    return false;
  }
}

/**
 * 安全移除DOM节点
 */
export function safeRemoveNode(node: Node | null): boolean {
  if (!isValidNode(node)) {
    return false;
  }

  try {
    const parent = node.parentNode;
    if (!parent) {
      return false;
    }

    // 确保父子关系仍然有效
    if (!parent.contains(node)) {
      return false;
    }

    parent.removeChild(node);
    return true;
  } catch (error) {
    console.error("safeRemoveNode: 移除节点时发生错误", error);
    return false;
  }
}

/**
 * 安全添加子节点
 */
export function safeAppendChild(
  parent: Node | null,
  child: Node | null,
): boolean {
  if (!isValidNode(parent) || !isValidNode(child)) {
    return false;
  }

  try {
    // 检查子节点是否已经有父节点
    if (child.parentNode && child.parentNode !== parent) {
      return false;
    }

    parent.appendChild(child);
    return true;
  } catch (error) {
    console.error("safeAppendChild: 添加子节点时发生错误", error);
    return false;
  }
}

/**
 * 安全下载文件
 */
export function safeDownloadFile(
  data: string,
  filename: string,
  mimeType = "text/plain",
): void {
  try {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    // 安全添加到DOM
    if (safeAppendChild(document.body, link)) {
      link.click();

      // 延迟清理，确保下载完成
      setTimeout(() => {
        safeRemoveNode(link);
        URL.revokeObjectURL(url);
      }, 100);
    } else {
      // 如果无法添加到DOM，直接触发下载
      link.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("safeDownloadFile: 下载文件时发生错误", error);
  }
}
