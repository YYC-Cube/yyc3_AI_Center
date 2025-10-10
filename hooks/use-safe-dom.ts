"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  safeRemoveNode,
  safeAppendChild,
  safeDownloadFile,
} from "@/lib/dom-utils";

/**
 * 安全DOM操作Hook
 */
export function useSafeDOM() {
  const mountedRef = useRef(true);
  const elementsRef = useRef<Set<Node>>(new Set());

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // 清理所有创建的元素
      elementsRef.current.forEach((element) => {
        safeRemoveNode(element);
      });
      elementsRef.current.clear();
    };
  }, []);

  // 安全创建元素
  const safeCreateElement = useCallback(
    <K extends keyof HTMLElementTagNameMap>(
      tagName: K,
      options?: ElementCreationOptions,
    ): HTMLElementTagNameMap[K] | null => {
      if (!mountedRef.current) {
        console.warn("useSafeDOM: 组件已卸载，无法创建元素");
        return null;
      }

      try {
        const element = document.createElement(tagName, options);
        elementsRef.current.add(element);
        return element;
      } catch (error) {
        console.error("useSafeDOM: 创建元素时发生错误", error);
        return null;
      }
    },
    [],
  );

  // 安全移除元素
  const safeRemove = useCallback((element: Node | null): boolean => {
    if (!mountedRef.current) {
      console.warn("useSafeDOM: 组件已卸载，无法移除元素");
      return false;
    }

    if (element && elementsRef.current.has(element)) {
      elementsRef.current.delete(element);
    }

    return safeRemoveNode(element);
  }, []);

  // 安全添加元素
  const safeAppend = useCallback(
    (parent: Node | null, child: Node | null): boolean => {
      if (!mountedRef.current) {
        console.warn("useSafeDOM: 组件已卸载，无法添加元素");
        return false;
      }

      return safeAppendChild(parent, child);
    },
    [],
  );

  // 安全下载文件
  const safeDownload = useCallback(
    (data: string, filename: string, mimeType?: string): void => {
      if (!mountedRef.current) {
        console.warn("useSafeDOM: 组件已卸载，无法下载文件");
        return;
      }

      safeDownloadFile(data, filename, mimeType);
    },
    [],
  );

  // 检查组件是否仍然挂载
  const isMounted = useCallback((): boolean => {
    return mountedRef.current;
  }, []);

  return {
    safeCreateElement,
    safeRemove,
    safeAppend,
    safeDownload,
    isMounted,
  };
}
