/**
 * 抛出自定义错误
 * @param {Error} error 错误对象
 * @param {Number} code 错误码
 */
export function throwError(error, code = -100) {
  error.expose = true;
  error.code = code;
  throw error;
}

/**
 * 一些辅助函数
 */
export const helper = {
  // 判断类型
  isType: (o, targetType) => {
    return (
      Object.prototype.toString.call(o).toLowerCase() ===
      `[object ${targetType}]`.toLowerCase()
    );
  }
};