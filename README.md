# 基于钉钉表格的自动化翻译方案

此项目是基于`钉钉表格`实现的多语言自动化翻译功能，其主要功能包含：

1. 读取本地指定文件夹翻译 输入 or 输出 到`钉钉表格`
2. 支持 多语言配置
3. 支持 .ts | .json 两种格式的文件
4. 支持使用 google 翻译，进行多语言翻译，需要自己提供 key
5. 支持智能生成翻译的 key 值，需要自己提供 gtp key
6. 智能翻译，不翻译{}的内容，也就是 i18n 的变量名
7. 对于 {xx xx}模式，我们会修正为{xxxx}，防止 i18n 报错
8. 支持扩展语言，在原有基础上新增新的语言

## Base 参数字段说明

这些参数是重要参数，在使用 input & output 功能的时候，都需要携带这些参数

| 字段名称   | 类型                    | 是否必填 | 说明           |
| ---------- | ----------------------- | -------- | -------------- |
| sysConfig  | TranslationConfig       | 是       | 系统配置       |
| langConfig | TranslationLangConfig[] | 是       | 多语言配置     |
| fileType   | "ts" or "json"          | 是       | 翻译文件的格式 |

### 系统配置 sysConfig ｜ TranslationConfig

| 字段名称   | 类型                                             | 是否必填 | 说明                                       |
| ---------- | ------------------------------------------------ | -------- | ------------------------------------------ |
| localePath | string                                           | 是       | 项目的翻译目录                             |
| workBookId | string                                           | 是       | 翻译文档 workId                            |
| operatorId | string                                           | 是       | 钉钉操作者的 Id，需要有操作表格 API 的权限 |
| appKey     | string                                           | 是       | 钉钉的 APP key                             |
| appSecret  | string                                           | 是       | 钉钉的 app 密钥                            |
| gptKey     | string                                           | 是       | 用于智能生成 i18n key                      |
| gptModel   | string                                           | 否       | gpt 的 model 默认 3.5                      |
| setMaxNum  | number                                           | 否       | 一次性最多处理多少条数据 默认 400          |
| translate  | { <br> projectId: string;<br> key: string; <br>} | 是       | google 翻译的配置，用于多语言的            |

### 语言配置 langConfig ｜ TranslationLangConfig

```
/**
 * 其中第一个必须是key值，后面才陆续是语言
 * key值的value是空的，dirText也是空的
 * @example
 * {
 *      text: 'key值',
 *      value: '',
 *      dirText: '',
 *      cellKey: 'F'
 * }
 */
```

| 字段名称 | 类型   | 是否必填 | 说明                                                                                            |
| -------- | ------ | -------- | ----------------------------------------------------------------------------------------------- |
| text     | string | 是       | 定义表格里面 对应语言的文案                                                                     |
| value    | string | 是       | 对应 google 翻译的目标语言，例如 zh-CN、en-US                                                   |
| dirText  | string | 是       | 每个语言对应项目中的目录名称，例如 google 翻译对应 zh-CN 对应的翻译目录可能是 zh 或 zh-CN 或... |
| cellKey  | string | 是       | 在表格之中每个语言对应的列号，例如：F、G                                                        |

## input 接口传参字段说明

### optType

<font color=#ff4d4f>必填</font>
类型：OptionType

推荐只使用 1

```
enum OptionType {
    "UPDATE" = "1",
    "CREATE" = "2",
    "ADD_LANG" = "3",
}
```

```
翻译脚本的操作类型:
1: 批量修改，
2: 全部文档更新，这是一个高危操作，一般只在项目初始化的时候用到这个选项
3: 新增语言类型，新增语言类型也会更新整个文档
```

### sheetPageName

`只有在 optType 为 '1' 的时候生效`

<font color=#a0d911>选填</font>
类型：string

```
指定想要操作 那些工作表分页的名称，也对应的是翻译的文件名称
```

### sheetPageLines

`只有在 optType 为 '1' 的时候生效`

<font color=#a0d911>选填</font>
类型：string

```
指定更新工作表分页中的指定文案，多个文案用,连接，连续使用-连接
```

```
example：
    23,45,235
    23,34-45,66
```

### skipSheetNameList

<font color=#a0d911>选填</font>
类型：string[]

```
需要跳过的sheet表的名称
```

```
example：
    ['工作表1', 'xx'] 这些工作表将不会读取
```

### newLangCodeList

`只有在 optType 为 '3'的时候生效`

`新增的语言简码，需要和langConfig 中的value对应`

<font color=#a0d911>选填</font>
类型：string[]

```
新增语言的列表
```

```
example：
    ['ru-RU']
```

### translateOrigin

`需要和langConfig 中的value对应`

<font color=#a0d911>选填</font>
类型：[string[], string][]

```
特殊的翻译群体，使用数组的第一个作为翻译成的语言，数组的第二个作为目标翻译语言
```

```
example：
    [['zh-TW', 'xx'], 'zh-CN'] 代表['zh-TW', 'xx']使用zh-CN作为母语翻译
```

### skipTranslateLangList

`需要和langConfig 中的value对应`

<font color=#a0d911>选填</font>
类型：string[]

```
跳过需要要翻译的语言
```

```
example：
    ['zh-CN'], 将不会对这种语言进行自动翻译
```

### gptGenerateKey

`gpt生成key值，对应langConfig数组的下标`

<font color=#a0d911>选填</font>
类型：number[]

`默认值`
[1,2]

```
gpt生成key值，对应langConfig数组的下标
备注：一般来说，1是中文，2是英文
```

```
example：
    [1,2] langConfig 是个数组，这个是数组的下标，0一般是key值
```

## output 接口传参字段说明

### translateOrigin

`需要和langConfig 中的value对应`

<font color=#a0d911>选填</font>
类型：string

`默认值`
'en-US'

```
翻译的原型语言, 需要和langConfig 中的value对应
在output中，这个语言作为循环文件的主文件
```

```
example：
    'en-US' 那么这个语言的目录将作为主目录，根据这个生成其他语言的目录结构
```

### skipLangNameList

<font color=#a0d911>选填</font>
类型：string[]

```
需要跳过的翻译文件名称, 仅在output方法中有作用
```

```
example：
    ['index.ts']
    ['index.json']
```

### skipSheetNameList

<font color=#a0d911>选填</font>
类型：string[]

```
需要跳过的sheet表的名称
```

```
example：
    ['工作表1', 'xx'] 这些工作表将不会读取
```
