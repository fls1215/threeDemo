module.exports = {
  "extends": [
    "airbnb",
    "prettier",
    "prettier/react"
  ],
  "singleQuote": true, // 使用单引号
  "printWidth": 80, // 超过最大值换行
  "tabWidth": 2, // 缩进2格
  "htmlWhitespaceSensitivity": "ignore",
  "semi": true, // 结尾用分号
  "trailingComma": "none", // 函数最后不需要逗号
  "bracketSpacing": true, // 在对象，数组括号与文字之间加空格 "{ foo: bar }"
  "jsxBracketSameLine": false, // 在jsx中把'>' 单独放一行
};