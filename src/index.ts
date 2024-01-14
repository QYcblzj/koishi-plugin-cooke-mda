import { Context, Schema, Command } from 'koishi';
import axios from 'axios';

// ...（此处包含了完整的接口定义）
interface Nutrients {
  [key: string]: {
    label: string;
    quantity: number;
    unit: string;
  };
}

interface Ingredient {
  text: string;
  parsed: Array<{
    quantity: number;
    food: string;
    foodId: string;
    weight: number;
    retainedWeight: number;
    nutrients: Nutrients;
  }>;
}
interface NutritionDataResponse {
  uri: string;
  calories: number;
  totalWeight: number;
  dietLabels: string[];
  healthLabels: string[];
  cautions: string[];
  totalNutrients: Nutrients;
  totalDaily: Nutrients;
  ingredients: Ingredient[];
  totalNutrientsKCal: Nutrients;
}
// ...（此处包含了完整的fetchNutritionData函数实现）

export const name = 'cooke-mda';

// 定义插件配置接口
export interface Config {
  appId: string;
  appKey: string;
}

// 使用 Schema 定义配置项
export const Config: Schema<Config> = Schema.object({
  appId: Schema.string().description('Edamam的应用ID').required(),
  appKey: Schema.string().description('Edamam的应用密钥').required(),
});


export function apply(ctx: Context, config: Config) {
  const { appId, appKey } = config;
  // 创建一个命令 'nutrition <ingredient>'
  ctx.command('nutrition <ingredient>', '查询食物的营养信息')
    .option('detail', '-d 显示详细的营养成分信息')
    .action(async ({options}, ingredient) => {
      // 如果没有提供食材名称，则提示用户
      if (!ingredient) {
        return '请输入食物名称。';
      }

      // 调用 fetchNutritionData 函数获取数据
      const data = await fetchNutritionData(ingredient, appId, appKey);
      // 如果没有获取到数据，则返回错误信息
      if (!data) {
        return '无法获取该食材的营养信息。';
      }

      // 格式化输出基本营养信息
      let reply = `食材：${ingredient}\n卡路里：${data.calories} kcal\n总重量：${data.totalWeight} g\n`;
      reply += `饮食标签：${data.dietLabels.join(', ')}\n健康标签：${data.healthLabels.join(', ')}\n`;

      // 如果用户请求详细信息，则添加每种营养素的信息
      if (options.detail) {
        reply += '详细营养成分：\n';
        for (const key in data.totalNutrients) {
          const nutrient = data.totalNutrients[key];
          reply += `${nutrient.label}：${nutrient.quantity.toFixed(2)} ${nutrient.unit}\n`;
        }
      }

      return reply;
    });
}

async function fetchNutritionData(ingredient: string, appId: string, appKey: string): Promise<NutritionDataResponse | null> {
  try {
    const response = await axios.get<NutritionDataResponse>(`https://api.edamam.com/api/nutrition-data`, {
      params: {
        app_id: appId,
        app_key: appKey,
        nutrition_type: 'cooking',
        ingr: ingredient,
      },
    });

    if (response.status === 200) {
      console.log('Data fetched successfully:', response.data);
      return response.data;
    } else {
      console.log('Response status:', response.status);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error message:', error.message);
      return null;
    } else {
      console.error('Unexpected error:', error);
      return null;
    }
  }
};