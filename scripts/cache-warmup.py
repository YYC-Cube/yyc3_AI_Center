import requests
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# 缓存预热配置
WARMUP_CONFIG = {
    "weather": [
        {"city": "北京"},
        {"city": "上海"},
        {"city": "广州"},
        {"city": "深圳"},
        {"city": "杭州"},
        {"city": "成都"},
        {"city": "武汉"},
        {"city": "西安"},
    ],
    "news": [
        {"category": "technology"},
        {"category": "business"},
        {"category": "health"},
        {"category": "sports"},
        {"category": "general"},
    ],
    "currency": [
        {"from": "USD", "to": "CNY"},
        {"from": "EUR", "to": "CNY"},
        {"from": "JPY", "to": "CNY"},
        {"from": "GBP", "to": "CNY"},
        {"from": "CNY", "to": "USD"},
    ],
}


def warmup_service(service, params_list, base_url="http://localhost:3000"):
    """预热指定服务的缓存"""
    print(f"开始预热 {service} 服务缓存...")

    success_count = 0
    error_count = 0

    def make_request(params):
        try:
            url = f"{base_url}/api/{service}"

            # 根据服务类型调整请求参数
            if service == "currency":
                # 汇率转换需要添加金额参数
                params["amount"] = 100

            response = requests.post(
                url,
                json=params,
                timeout=10,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 200:
                return {"success": True, "params": params}
            else:
                return {"success": False, "params": params, "error": response.text}

        except Exception as e:
            return {"success": False, "params": params, "error": str(e)}

    # 使用线程池并发请求
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_params = {
            executor.submit(make_request, params): params for params in params_list
        }

        for future in as_completed(future_to_params):
            result = future.result()
            if result["success"]:
                success_count += 1
                print(f"✅ {service} 预热成功: {result['params']}")
            else:
                error_count += 1
                print(
                    f"❌ {service} 预热失败: {result['params']} - {result.get('error', 'Unknown error')}"
                )

            # 避免请求过于频繁
            time.sleep(0.1)

    print(f"{service} 预热完成: 成功 {success_count}, 失败 {error_count}")
    return success_count, error_count


def main():
    """主预热函数"""
    print("🚀 开始缓存预热...")
    start_time = time.time()

    total_success = 0
    total_error = 0

    for service, params_list in WARMUP_CONFIG.items():
        try:
            success, error = warmup_service(service, params_list)
            total_success += success
            total_error += error

            # 服务间稍作停顿
            time.sleep(1)

        except Exception as e:
            print(f"❌ {service} 服务预热异常: {e}")
            total_error += len(params_list)

    end_time = time.time()
    duration = end_time - start_time

    print(f"\n📊 缓存预热总结:")
    print(f"• 总耗时: {duration:.2f} 秒")
    print(f"• 成功请求: {total_success}")
    print(f"• 失败请求: {total_error}")
    print(
        f"• 成功率: {(total_success / (total_success + total_error) * 100):.1f}%"
        if (total_success + total_error) > 0
        else "• 成功率: 0%"
    )

    # 获取缓存统计
    try:
        response = requests.get("http://localhost:3000/api/cache/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"\n📈 缓存统计:")
            print(f"• 总命中率: {stats['summary']['hitRate']:.1f}%")
            print(f"• 总命中次数: {stats['summary']['totalHits']}")
            print(f"• 总未命中次数: {stats['summary']['totalMisses']}")
            print(f"• 内存缓存大小: {stats['stats']['memoryCache']['size']} 字节")
            print(f"• 内存缓存键数: {stats['stats']['memoryCache']['keys']}")
        else:
            print("⚠️ 无法获取缓存统计信息")
    except Exception as e:
        print(f"⚠️ 获取缓存统计失败: {e}")

    print("\n✅ 缓存预热完成!")


if __name__ == "__main__":
    main()
