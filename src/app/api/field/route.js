/**
 * 文件: src/app/api/field/route.js
 * 用途: 表字段（Field）的 CRUD API 路由
 *
 * 本文件对应路径 /api/field，提供字段的创建、更新和删除操作。
 *
 * 字段（Field）是数据表的列定义，描述了表中每一列的属性：
 * - 字段名（name）：如 "username"、"email"
 * - 数据类型（type）：如 "VARCHAR"、"INT"、"TIMESTAMP"
 * - 约束（constraints）：如 主键（PK）、非空（NOT NULL）、唯一（UNIQUE）等
 * - 默认值（default）：如 "NOW()"、"0"
 *
 * 在可视化画布的表节点中，每个字段显示为表的一行。
 *
 * 本文件提供的接口：
 * - POST   /api/field          - 创建新字段
 * - PUT    /api/field          - 更新字段属性
 * - DELETE /api/field?id=xxx   - 删除字段
 */

// fieldService: 字段的业务逻辑服务层
import { fieldService } from '@/server/services/field.service';
import { Ok, BadRequest } from '@/server/lib/response';
import { withLogger } from '@/server/lib/withLogger';

/**
 * Field API 路由
 * POST   /api/field - 创建字段
 * PUT    /api/field - 更新字段
 * DELETE /api/field?id=xxx - 删除字段
 */

/**
 * POST /api/field
 * 创建新的字段
 *
 * 请求体 (JSON): {
 *   tableId: string,     - 所属表的 ID
 *   name: string,        - 字段名
 *   type: string,        - 数据类型
 *   isPrimaryKey?: boolean,  - 是否主键
 *   isNullable?: boolean,    - 是否允许 NULL
 *   defaultValue?: string,   - 默认值
 *   ...
 * }
 *
 * 响应格式: { data: Field } - 创建成功的字段对象
 */
// POST /api/field
export const POST = withLogger(async (request) => {
  try {
    const body = await request.json();
    const field = await fieldService.createField(body);
    return Ok(field);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * PUT /api/field
 * 更新字段的属性（名称、类型、约束等）
 *
 * 请求体 (JSON): { id: string, name?: string, type?: string, ... }
 * 响应格式: { data: Field } - 更新后的字段对象
 */
// PUT /api/field
export const PUT = withLogger(async (request) => {
  try {
    const body = await request.json();
    const field = await fieldService.updateField(body);
    return Ok(field);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * DELETE /api/field?id=xxx
 * 删除指定的字段
 *
 * 请求参数 (Query String):
 *   - id: string (必填) - 要删除的字段 ID
 *
 * 响应格式: { data: { id: string } } - 返回被删除的字段 ID
 *
 * 注意：删除字段时，相关的索引和关联关系可能也需要级联处理，
 * 这部分逻辑在 service 层中实现。
 */
// DELETE /api/field?id=xxx
export const DELETE = withLogger(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return BadRequest('id is required');
    }

    await fieldService.deleteField({ id });
    return Ok({ id });
  } catch (error) {
    return BadRequest(error.message);
  }
});
