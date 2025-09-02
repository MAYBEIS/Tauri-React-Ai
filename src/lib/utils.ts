/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02 15:23:22
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-02 15:23:37
 * @FilePath: \Tauri-React-Ai\src\lib\utils.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}