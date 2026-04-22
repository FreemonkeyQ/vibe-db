/**
 * 枚举定义模块
 *
 * 【文件用途】
 * 集中定义项目中使用的所有枚举常量，主要包括：
 * 1. PostgreSQL 字段数据类型（数值、字符、日期等各大类）
 * 2. PostgreSQL 索引类型（B-Tree、Hash、GIN 等）
 * 3. 表关联关系基数（一对一、一对多、多对多）
 *
 * 【在项目中的角色】
 * 这些枚举被前端组件（如字段编辑表单的下拉选择框）和后端校验逻辑共同使用。
 * 集中定义可以确保前后端使用相同的值，避免因硬编码字符串导致的不一致 bug。
 *
 * 【关键概念】
 * - 枚举（Enum）：一组固定的命名常量，用于限制变量只能取预定义的值
 * - Mantine Select：项目使用的 UI 组件库 Mantine 中的下拉选择组件，需要 { value, label } 格式的选项数据
 * - PostgreSQL 数据类型：每种类型决定了字段能存储什么样的数据、占用多少空间
 */

// ────────────────────────────── 字段数据类型 ──────────────────────────────

/**
 * 数值类型
 * 用于存储整数、小数、浮点数等数字数据
 * 选择建议：一般整数用 integer，需要精确小数用 numeric，自增主键用 serial
 */
export const NumericType = {
  SMALLINT: 'smallint', // 2字节整数 (-32768 ~ 32767)，适合存储小范围整数如年龄、状态码
  INTEGER: 'integer', // 4字节整数 (-2147483648 ~ 2147483647)，最常用的整数类型
  BIGINT: 'bigint', // 8字节整数，适合存储超大数值如雪花ID、计数器
  DECIMAL: 'decimal', // 精确小数，等同 numeric，适合金额等不能有精度损失的场景
  NUMERIC: 'numeric', // 精确小数，可指定精度和小数位，如 numeric(10,2) 表示最多10位数字其中2位小数
  REAL: 'real', // 4字节浮点数，有精度损失，适合科学计算
  DOUBLE_PRECISION: 'double precision', // 8字节浮点数，精度更高的浮点数
  SMALLSERIAL: 'smallserial', // 自增2字节整数，自动递增，常用于小表主键
  SERIAL: 'serial', // 自增4字节整数，最常用的自增主键类型
  BIGSERIAL: 'bigserial', // 自增8字节整数，适合数据量极大的表
};

/**
 * 字符类型
 * 用于存储文本字符串
 * 选择建议：大多数场景直接用 text 或 varchar 即可
 */
export const CharacterType = {
  VARCHAR: 'varchar', // 可变长度字符串，可指定最大长度如 varchar(255)，超出会报错
  CHAR: 'char', // 固定长度字符串，不足会用空格填充，适合存储固定长度的编码
  TEXT: 'text', // 不限长度字符串，适合存储长文本如文章内容、描述
};

/**
 * 二进制类型
 * 用于存储二进制数据（如文件、图片的原始字节）
 */
export const BinaryType = {
  BYTEA: 'bytea', // 变长二进制数据，可存储任意字节序列
};

/**
 * 日期/时间类型
 * 用于存储时间相关数据
 * 选择建议：需要时区信息时用 timestamptz（推荐），不需要时区用 timestamp
 */
export const DateTimeType = {
  DATE: 'date', // 日期 (年月日)，不含时间部分
  TIME: 'time', // 时间 (时分秒)，不含时区信息
  TIMETZ: 'timetz', // 时间，含时区信息
  TIMESTAMP: 'timestamp', // 日期+时间，不含时区（存什么就是什么）
  TIMESTAMPTZ: 'timestamptz', // 日期+时间，含时区（推荐！会自动转换为 UTC 存储）
  INTERVAL: 'interval', // 时间间隔，如 '3 days' 或 '2 hours 30 minutes'
};

/**
 * 布尔类型
 * 只有 true/false 两个值，适合存储开关状态、是否标记等
 */
export const BooleanType = {
  BOOLEAN: 'boolean', // true / false
};

/**
 * 网络地址类型
 * PostgreSQL 特有的网络地址存储类型，提供地址验证和子网计算等功能
 */
export const NetworkType = {
  INET: 'inet', // IPv4 或 IPv6 地址，如 '192.168.1.1' 或 '::1'
  CIDR: 'cidr', // IPv4 或 IPv6 网络地址（含子网掩码），如 '192.168.1.0/24'
  MACADDR: 'macaddr', // MAC 地址，如 '08:00:2b:01:02:03'
};

/**
 * JSON 类型
 * 用于存储 JSON 格式的数据，适合存储结构不固定的数据
 * 选择建议：几乎总是应该选 jsonb，因为支持索引和更高效的查询
 */
export const JsonType = {
  JSON: 'json', // 存储 JSON 文本（原样存储，每次查询都需要重新解析）
  JSONB: 'jsonb', // 存储二进制 JSON（支持索引和高效查询，推荐！）
};

/**
 * UUID 类型
 * 128位全局唯一标识符，格式如 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
 * 适合作为分布式系统中的主键，避免自增ID的冲突问题
 */
export const UuidType = {
  UUID: 'uuid', // 128位唯一标识符
};

/**
 * 数组类型
 * PostgreSQL 支持将任意类型定义为数组，如 integer[]、text[]
 */
export const ArrayType = {
  ARRAY: 'array', // 任意类型的数组
};

/**
 * 枚举类型（用户自定义）
 * 可以定义一组允许的值，如 CREATE TYPE mood AS ENUM ('happy', 'sad')
 */
export const EnumType = {
  ENUM: 'enum', // 用户定义的枚举类型
};

/**
 * 全文搜索类型
 * PostgreSQL 内置的全文搜索功能所使用的数据类型
 */
export const TextSearchType = {
  TSVECTOR: 'tsvector', // 全文搜索文档（将文本分词后的结果）
  TSQUERY: 'tsquery', // 全文搜索查询（用户输入的搜索条件）
};

/**
 * 几何类型
 * 用于存储二维平面上的几何对象，支持几何运算（如距离、包含等）
 */
export const GeometricType = {
  POINT: 'point', // 平面上的点 (x, y)
  LINE: 'line', // 无限延伸的直线
  LSEG: 'lseg', // 线段（有起点和终点）
  BOX: 'box', // 矩形（由对角两点定义）
  PATH: 'path', // 路径（一系列连接的点）
  POLYGON: 'polygon', // 多边形（封闭的路径）
  CIRCLE: 'circle', // 圆（由圆心和半径定义）
};

/**
 * 所有 PostgreSQL 字段类型的合集
 *
 * 【为什么这样写】
 * 使用展开运算符 (...) 将所有分类的类型合并到一个对象中，
 * 方便在需要"不分类"地使用所有类型时直接引用。
 * 例如校验用户输入的类型是否合法：Object.values(PgFieldType).includes(userInput)
 */
export const PgFieldType = {
  ...NumericType,
  ...CharacterType,
  ...BinaryType,
  ...DateTimeType,
  ...BooleanType,
  ...NetworkType,
  ...JsonType,
  ...UuidType,
  ...ArrayType,
  ...EnumType,
  ...TextSearchType,
  ...GeometricType,
};

/**
 * 按分组分类的字段类型列表
 *
 * 【为什么这样写】
 * UI 中的下拉选择框需要将类型按组展示（如"数值"组下有 smallint/integer 等），
 * 这样用户能更快找到需要的类型。这个数据结构正好对应分组下拉的数据格式。
 */
export const PG_FIELD_TYPE_GROUPS = [
  { group: '数值', items: Object.values(NumericType) },
  { group: '字符', items: Object.values(CharacterType) },
  { group: '二进制', items: Object.values(BinaryType) },
  { group: '日期/时间', items: Object.values(DateTimeType) },
  { group: '布尔', items: Object.values(BooleanType) },
  { group: '网络地址', items: Object.values(NetworkType) },
  { group: 'JSON', items: Object.values(JsonType) },
  { group: 'UUID', items: Object.values(UuidType) },
  { group: '数组', items: Object.values(ArrayType) },
  { group: '枚举', items: Object.values(EnumType) },
  { group: '全文搜索', items: Object.values(TextSearchType) },
  { group: '几何', items: Object.values(GeometricType) },
];

/**
 * Mantine Select 组件所需的分组选项格式
 *
 * 【为什么这样写】
 * Mantine 的 Select 组件支持分组下拉，但需要扁平化的数组格式：
 * [{ group: '数值', value: 'integer', label: 'integer' }, ...]
 * flatMap 先遍历每个分组，再将每个分组内的 items 映射为 { group, value, label } 对象，
 * 最终得到一个扁平的一维数组。
 */
export const PG_FIELD_TYPE_OPTIONS = PG_FIELD_TYPE_GROUPS.flatMap(({ group, items }) =>
  items.map((item) => ({ group, value: item, label: item }))
);

// ────────────────────────────── 索引类型 ───────────────────────────────────────

/**
 * PostgreSQL 索引类型
 *
 * 索引是数据库的"目录"，能大幅加速查询，但会占用额外存储空间并减慢写入速度。
 * 不同类型的索引适用于不同的查询场景：
 */
export const PgIndexType = {
  BTREE: 'BTREE', // B-Tree：默认类型，适合等值查询（=）和范围查询（<、>、BETWEEN）
  HASH: 'HASH', // 哈希索引：仅适合等值查询（=），不支持范围查询，但等值查询更快
  GIN: 'GIN', // 通用倒排索引：适合数组包含查询、JSONB 查询、全文搜索
  GIST: 'GIST', // 通用搜索树：适合几何数据查询、全文搜索、范围类型
  BRIN: 'BRIN', // 块范围索引：适合超大表中物理有序的数据（如时序数据），体积极小
};

/**
 * 索引类型的 Mantine Select 选项格式
 */
export const PG_INDEX_TYPE_OPTIONS = Object.values(PgIndexType).map((t) => ({
  value: t,
  label: t,
}));

// ────────────────────────────── 关联关系基数 ─────────────────────────────────────

/**
 * 表与表之间的关联关系基数（Cardinality）
 *
 * 【关键概念】
 * - 一对一（ONE_TO_ONE）：一条记录只对应另一张表的一条记录，如"用户"对"用户档案"
 * - 一对多（ONE_TO_MANY）：一条记录对应另一张表的多条记录，如"部门"对"员工"
 * - 多对多（MANY_TO_MANY）：两张表的记录互相对应多条，如"学生"对"课程"（需要中间表）
 */
export const Cardinality = {
  ONE_TO_ONE: 'ONE_TO_ONE',
  ONE_TO_MANY: 'ONE_TO_MANY',
  MANY_TO_MANY: 'MANY_TO_MANY',
};

/**
 * 关联关系的 Mantine Select 选项格式（带中文标签）
 */
export const CARDINALITY_OPTIONS = [
  { value: 'ONE_TO_ONE', label: '一对一' },
  { value: 'ONE_TO_MANY', label: '一对多' },
  { value: 'MANY_TO_MANY', label: '多对多' },
];
