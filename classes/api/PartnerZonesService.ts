/**
 * Сервис для работы с зонами партнеров
 */

import { AbstractApiService } from "./AbstractApiService";
import type {
  GetPositionGroupsWebRequest,
  GetPositionGroupsWebResponse,
  UpdatePositionGroupRequest,
  CreatePositionGroupRequest,
  GetSpheresRequest,
  GetSpheresResponse,
} from "@/types/partner-zones";

/**
 * Сервис для работы с зонами партнеров
 */
export class PartnerZonesService extends AbstractApiService {
  /**
   * Получение имени сервиса для API Gateway
   */
  protected getServiceName(): string {
    return "PartnerZonesService";
  }

  /**
   * Получение групп позиций для веба
   * @param request - Параметры запроса
   * @returns - Группы позиций
   */
  async getPositionGroupsWeb(
    request: GetPositionGroupsWebRequest,
  ): Promise<GetPositionGroupsWebResponse> {
    return this.sendRequest<GetPositionGroupsWebResponse>(
      "GetPositionGroupsWeb",
      request,
    );
  }

  /**
   * Обновление группы позиций
   * @param request - Данные для обновления
   * @returns - Результат обновления
   */
  async updatePositionGroup(request: UpdatePositionGroupRequest): Promise<void> {
    return this.sendRequest<void>("UpdatePositionGroup", request);
  }

  /**
   * Создание группы позиций
   * @param request - Данные для создания
   * @returns - Результат создания
   */
  async createPositionGroup(request: CreatePositionGroupRequest): Promise<void> {
    return this.sendRequest<void>("CreatePositionGroup", request);
  }

  /**
   * Получение сфер
   * @param request - Параметры запроса (id всегда null)
   * @returns - Список сфер
   */
  async getSpheres(request: GetSpheresRequest): Promise<GetSpheresResponse> {
    return this.sendRequest<GetSpheresResponse>("GetSpheres", request);
  }
}
