/**
 * 文件: src/app/api/relation/route.js
 * 用途: 表关联关系（Relation）的 CRUD API 路由
 *
 * 本文件对应路径 /api/relation，提供关联关系的增删改查操作。
 *
 * 关联关系（Relation）描述了数据表之间的引用关系，例如：
 * - 一对一（1:1）：一个用户对应一个档案
 * - 一对多（1:N）：一个用户有多个订单
 * - 多对多（M:N）：学生和课程的关系
 *
 * 在可视化画布中，关联关系会表示为表节点之间的连线（Edge）。
 *
 * 本文件提供的接口：
 * - GET    /api/relation?schemaId=xxx  - 查询指定 Schema 下的所有关联
 * - POST   /api/relation               - 创建新关联
 * - PUT    /api/relation               - 更新关联
 * - DELETE /api/relation?id=xxx        - 删除关联
 */

// relationService: 关联关系的业务逻辑服务层
import { relationService } from '@/server/services/relation.service';
import { Ok, BadRequest } from '@/server/lib/response';
import { withLogger } from '@/server/lib/withLogger';

/**
 * Relation API 路由
 * GET    /api/relation?schemaId=xxx - 查询关联列表
 * POST   /api/relation - 创建关联
 * PUT    /api/relation - 更新关联
 * DELETE /api/relation?id=xxx - 删除关联
 */

/**
 * GET /api/relation?schemaId=xxx
 * 查询指定 Schema 下的所有关联关系
 *
 * 请求参数 (Query String):
 *   - schemaId: string (必填) - 所属 Schema 的 ID
 *
 * 响应格式: { data: Relation[] } - 关联关系对象数组
 */
// GET /api/relation?schemaId=xxx
export const GET = withLogger(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const schemaId = searchParams.get('schemaId');

    if (!schemaId) {
      return BadRequest('schemaId is required');
    }

    // 查询该 Schema 下的所有关联关系
    const relations = await relationService.getRelationsBySchemaId(schemaId);
    return Ok(relations);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * POST /api/relation
 * 创建新的关联关系
 *
 * 请求体 (JSON): {
 *   schemaId: string,        - 所属 Schema ID
 *   sourceTableId: string,   - 源表 ID
 *   sourceFieldId: string,   - 源字段 ID
 *   targetTableId: string,   - 目标表 ID
 *   targetFieldId: string,   - 目标字段 ID
 *   type: string,            - 关联类型（如 "one-to-many"）
 *   ...
 * }
 *
 * 响应格式: { data: Relation } - 创建成功的关联对象
 */
// POST /api/relation
export const POST = withLogger(async (request) => {
  try {
    const body = await request.json();
    const relation = await relationService.createRelation(body);
    return Ok(relation);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * PUT /api/relation
 * 更新关联关系的配置
 *
 * 请求体 (JSON): { id: string, type?: string, ... }
 * 响应格式: { data: Relation } - 更新后的关联对象
 */
// PUT /api/relation
export const PUT = withLogger(async (request) => {
  try {
    const body = await request.json();
    const relation = await relationService.updateRelation(body);
    return Ok(relation);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * DELETE /api/relation?id=xxx
 * 删除指定的关联关系
 *
 * 请求参数 (Query String):
 *   - id: string (必填) - 要删除的关联 ID
 *
 * 响应格式: { data: { id: string } } - 返回被删除的关联 ID
 */
// DELETE /api/relation?id=xxx
export const DELETE = withLogger(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return BadRequest('id is required');
    }

    await relationService.deleteRelation(id);
    // 返回被删除的 ID，方便前端从状态中移除
    return Ok({ id });
  } catch (error) {
    return BadRequest(error.message);
  }
});
