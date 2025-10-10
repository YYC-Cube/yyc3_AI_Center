import random
import time
import json
from datetime import datetime, timedelta


def generate_mock_monitoring_data():
    """生成模拟监控数据用于测试"""

    services = [
        "weather",
        "news",
        "ipinfo",
        "currency",
        "stock",
        "geocode",
        "translate",
        "qrcode",
    ]

    # 生成过去24小时的模拟数据
    now = datetime.now()
    data_points = []

    for service in services:
        # 每个服务生成100-500个数据点
        num_requests = random.randint(100, 500)

        for i in range(num_requests):
            # 随机时间点（过去24小时内）
            timestamp = now - timedelta(hours=random.uniform(0, 24))

            # 模拟响应时间（正态分布）
            base_response_time = {
                "weather": 800,
                "news": 1200,
                "ipinfo": 300,
                "currency": 600,
                "stock": 1500,
                "geocode": 2000,
                "translate": 1800,
                "qrcode": 200,
            }

            response_time = max(
                50,
                random.normalvariate(
                    base_response_time[service], base_response_time[service] * 0.3
                ),
            )

            # 模拟状态码（95%成功率）
            status_code = (
                200
                if random.random() < 0.95
                else random.choice([400, 404, 429, 500, 503])
            )

            # 模拟缓存命中（70%命中率）
            cache_hit = random.random() < 0.7

            data_point = {
                "service": service,
                "timestamp": timestamp.isoformat(),
                "response_time": round(response_time),
                "status_code": status_code,
                "cache_hit": cache_hit,
                "success": status_code < 400,
            }

            data_points.append(data_point)

    # 按时间排序
    data_points.sort(key=lambda x: x["timestamp"])

    # 生成汇总统计
    summary = {}
    for service in services:
        service_data = [d for d in data_points if d["service"] == service]

        total_requests = len(service_data)
        success_requests = len([d for d in service_data if d["success"]])
        cache_hits = len([d for d in service_data if d["cache_hit"]])
        response_times = [d["response_time"] for d in service_data]

        summary[service] = {
            "total_requests": total_requests,
            "success_requests": success_requests,
            "error_requests": total_requests - success_requests,
            "success_rate": (
                success_requests / total_requests if total_requests > 0 else 0
            ),
            "error_rate": (
                (total_requests - success_requests) / total_requests
                if total_requests > 0
                else 0
            ),
            "cache_hit_rate": cache_hits / total_requests if total_requests > 0 else 0,
            "avg_response_time": (
                sum(response_times) / len(response_times) if response_times else 0
            ),
            "p95_response_time": (
                sorted(response_times)[int(len(response_times) * 0.95)]
                if response_times
                else 0
            ),
            "p99_response_time": (
                sorted(response_times)[int(len(response_times) * 0.99)]
                if response_times
                else 0
            ),
        }

    # 生成系统健康数据
    system_health = {
        "uptime": random.randint(86400, 2592000) * 1000,  # 1-30天的毫秒数
        "cpu_usage": random.uniform(10, 80),
        "memory_usage": random.uniform(200, 800),
        "active_connections": random.randint(50, 200),
        "total_requests": sum(s["total_requests"] for s in summary.values()),
        "error_rate": sum(
            s["error_rate"] * s["total_requests"] for s in summary.values()
        )
        / sum(s["total_requests"] for s in summary.values()),
    }

    # 生成警报数据
    alerts = []
    for service in services:
        if summary[service]["error_rate"] > 0.1:
            alerts.append(
                {
                    "id": f"{service}-error-{int(time.time())}",
                    "type": "error",
                    "service": service,
                    "message": f"{service}服务错误率过高: {summary[service]['error_rate']*100:.1f}%",
                    "timestamp": int(time.time() * 1000),
                    "resolved": False,
                }
            )
        elif summary[service]["avg_response_time"] > 2000:
            alerts.append(
                {
                    "id": f"{service}-warning-{int(time.time())}",
                    "type": "warning",
                    "service": service,
                    "message": f"{service}服务响应时间过长: {summary[service]['avg_response_time']:.0f}ms",
                    "timestamp": int(time.time() * 1000),
                    "resolved": False,
                }
            )

    result = {
        "timestamp": datetime.now().isoformat(),
        "data_points": data_points,
        "summary": summary,
        "system_health": system_health,
        "alerts": alerts,
        "total_data_points": len(data_points),
        "time_range": "24小时",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    print("🎯 监控数据生成完成!")
    print(f"📊 总数据点: {len(data_points)}")
    print(f"🔧 服务数量: {len(services)}")
    print(f"⚠️ 活跃警报: {len(alerts)}")
    print(f"📈 系统运行时间: {system_health['uptime']/1000/3600:.1f}小时")
    print(f"💾 CPU使用率: {system_health['cpu_usage']:.1f}%")
    print(f"🔄 总请求数: {system_health['total_requests']}")

    # 显示各服务统计
    print("\n📋 各服务统计:")
    for service, stats in summary.items():
        print(
            f"  {service}: {stats['total_requests']}请求, "
            f"{stats['success_rate']*100:.1f}%成功率, "
            f"{stats['avg_response_time']:.0f}ms平均响应"
        )

    return result


if __name__ == "__main__":
    # 生成监控数据
    monitoring_data = generate_mock_monitoring_data()

    # 保存到文件（可选）
    with open("monitoring_data.json", "w", encoding="utf-8") as f:
        json.dump(monitoring_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 监控数据已保存到 monitoring_data.json")
    print("🚀 可以使用此数据测试监控仪表板功能")
