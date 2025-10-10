"""
高级 PyTorch 图像分类演示
包含多模型比较、性能评估和实际应用示例
"""

import torch
import torch.nn.functional as F
from torchvision import transforms, models
import time
import json
import random
from datetime import datetime

print("🚀 高级 PyTorch 图像分类演示")
print("=" * 60)

# 1. 多模型架构比较
print("🏗️ 支持的模型架构")
print("-" * 40)

model_configs = {
    "resnet18": {
        "name": "ResNet-18",
        "params": "11.7M",
        "size": "45MB",
        "accuracy": "69.8%",
        "speed": "50ms",
        "description": "轻量级，适合快速推理",
    },
    "resnet50": {
        "name": "ResNet-50",
        "params": "25.6M",
        "size": "98MB",
        "accuracy": "76.1%",
        "speed": "120ms",
        "description": "平衡性能与精度",
    },
    "mobilenet_v2": {
        "name": "MobileNet V2",
        "params": "3.5M",
        "size": "14MB",
        "accuracy": "71.9%",
        "speed": "30ms",
        "description": "移动端优化，极致轻量",
    },
    "efficientnet_b0": {
        "name": "EfficientNet-B0",
        "params": "5.3M",
        "size": "21MB",
        "accuracy": "77.7%",
        "speed": "80ms",
        "description": "效率优化，SOTA性能",
    },
}

for model_key, config in model_configs.items():
    print(f"📱 {config['name']}")
    print(f"   参数量: {config['params']}")
    print(f"   模型大小: {config['size']}")
    print(f"   准确率: {config['accuracy']}")
    print(f"   推理速度: {config['speed']}")
    print(f"   特点: {config['description']}")
    print()

# 2. 高级预处理管道
print("🔧 高级图像预处理管道")
print("-" * 40)

# 定义多种预处理策略
preprocessing_strategies = {
    "standard": transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    ),
    "augmented": transforms.Compose(
        [
            transforms.Resize(256),
            transforms.RandomCrop(224),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    ),
    "test_time_augmentation": transforms.Compose(
        [
            transforms.Resize(256),
            transforms.FiveCrop(224),
            transforms.Lambda(
                lambda crops: torch.stack(
                    [transforms.ToTensor()(crop) for crop in crops]
                )
            ),
            transforms.Lambda(
                lambda tensors: torch.stack(
                    [
                        transforms.Normalize(
                            mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                        )(t)
                        for t in tensors
                    ]
                )
            ),
        ]
    ),
}

print("✅ 标准预处理: 基础的缩放和归一化")
print("✅ 数据增强: 随机裁剪、翻转、颜色变换")
print("✅ 测试时增强: 多视角预测提升准确率")


# 3. 智能分类系统
class AdvancedImageClassifier:
    def __init__(self, model_name="resnet18"):
        self.model_name = model_name
        self.model_config = model_configs.get(model_name, model_configs["resnet18"])
        self.classes = self._load_classes()
        self.preprocessing = preprocessing_strategies["standard"]

    def _load_classes(self):
        """加载类别标签"""
        # 模拟 ImageNet 1000 类别
        categories = [
            "动物类",
            "植物类",
            "交通工具",
            "建筑物",
            "食物",
            "家具",
            "电子设备",
            "运动器材",
            "乐器",
            "工具",
            "服装",
            "玩具",
            "书籍",
            "艺术品",
            "自然景观",
        ]

        classes = []
        for category in categories:
            for i in range(67):  # 每类约67个子类，总计约1000类
                classes.append(f"{category}_{i+1}")

        return classes[:1000]

    def predict(self, image_info, top_k=5, use_tta=False):
        """
        执行图像分类预测

        Args:
            image_info: 图像信息
            top_k: 返回前k个结果
            use_tta: 是否使用测试时增强
        """
        start_time = time.time()

        print(f"🔍 使用 {self.model_config['name']} 进行分类...")

        # 模拟预测过程
        if use_tta:
            print("🔄 应用测试时增强 (TTA)...")
            time.sleep(0.2)  # TTA需要更多时间

        # 模拟推理时间
        inference_time = float(self.model_config["speed"].replace("ms", "")) / 1000
        time.sleep(inference_time)

        # 生成预测结果
        predictions = self._generate_predictions(image_info, top_k, use_tta)

        total_time = time.time() - start_time

        return {
            "predictions": predictions,
            "model": self.model_config["name"],
            "inference_time": total_time,
            "use_tta": use_tta,
        }

    def _generate_predictions(self, image_info, top_k, use_tta):
        """生成模拟预测结果"""
        # 根据图像类型生成相关的预测
        image_type = image_info.get("type", "unknown")

        # 定义类型相关的类别
        type_mapping = {
            "动物": ["猫科动物", "犬科动物", "鸟类", "哺乳动物", "宠物"],
            "交通工具": ["汽车", "飞机", "船只", "火车", "摩托车"],
            "植物": ["花朵", "树木", "草本植物", "蕨类", "苔藓"],
            "建筑": ["住宅", "商业建筑", "古建筑", "现代建筑", "桥梁"],
            "食物": ["水果", "蔬菜", "肉类", "甜点", "饮料"],
        }

        # 选择相关类别
        relevant_classes = type_mapping.get(image_type, random.sample(self.classes, 20))

        # 生成置信度分数
        base_scores = [random.uniform(0.3, 0.9) for _ in range(top_k)]

        # TTA通常能提升置信度
        if use_tta:
            base_scores = [min(0.95, score * 1.1) for score in base_scores]

        base_scores.sort(reverse=True)

        predictions = []
        selected_classes = random.sample(
            relevant_classes, min(top_k, len(relevant_classes))
        )

        for i, (score, class_name) in enumerate(zip(base_scores, selected_classes)):
            predictions.append(
                {
                    "rank": i + 1,
                    "class": class_name,
                    "confidence": score,
                    "percentage": score * 100,
                }
            )

        return predictions


# 4. 批量测试不同模型
print("\n🧪 多模型性能比较")
print("-" * 40)

test_images = [
    {"name": "金毛犬", "type": "动物", "complexity": "简单"},
    {"name": "跑车", "type": "交通工具", "complexity": "中等"},
    {"name": "玫瑰花", "type": "植物", "complexity": "简单"},
    {"name": "摩天大楼", "type": "建筑", "complexity": "复杂"},
    {"name": "意大利面", "type": "食物", "complexity": "中等"},
]

# 测试每个模型
results_summary = {}

for model_name in ["resnet18", "resnet50", "mobilenet_v2"]:
    print(f"\n🔬 测试模型: {model_configs[model_name]['name']}")
    print("-" * 30)

    classifier = AdvancedImageClassifier(model_name)
    model_results = []

    for img in test_images:
        print(f"\n📸 图像: {img['name']} ({img['complexity']})")

        # 标准预测
        result = classifier.predict(img, top_k=3, use_tta=False)
        print(f"   ⏱️ 推理时间: {result['inference_time']:.3f}s")
        print("   🎯 预测结果:")

        for pred in result["predictions"]:
            print(f"      {pred['rank']}. {pred['class']}: {pred['percentage']:.1f}%")

        model_results.append(result)

    # 计算模型平均性能
    avg_time = sum(r["inference_time"] for r in model_results) / len(model_results)
    avg_confidence = sum(
        r["predictions"][0]["confidence"] for r in model_results
    ) / len(model_results)

    results_summary[model_name] = {
        "avg_time": avg_time,
        "avg_confidence": avg_confidence,
        "model_config": classifier.model_config,
    }

    print(f"\n📊 {classifier.model_config['name']} 性能总结:")
    print(f"   平均推理时间: {avg_time:.3f}s")
    print(f"   平均置信度: {avg_confidence:.1f}%")

# 5. 性能对比分析
print("\n📈 模型性能对比分析")
print("=" * 50)

print("模型名称          推理时间    置信度    参数量    模型大小")
print("-" * 55)

for model_name, results in results_summary.items():
    config = results["model_config"]
    print(
        f"{config['name']:<15} {results['avg_time']:.3f}s     {results['avg_confidence']:.1f}%     {config['params']:<8} {config['size']}"
    )

# 6. 实际应用场景演示
print("\n🎯 实际应用场景演示")
print("-" * 40)

application_scenarios = [
    {
        "name": "移动端实时分类",
        "model": "mobilenet_v2",
        "requirements": ["低延迟", "小模型", "省电"],
        "use_case": "手机相册自动分类",
    },
    {
        "name": "服务器端批处理",
        "model": "resnet50",
        "requirements": ["高精度", "批处理", "稳定性"],
        "use_case": "电商商品自动标注",
    },
    {
        "name": "边缘设备部署",
        "model": "resnet18",
        "requirements": ["平衡性能", "适中大小", "快速响应"],
        "use_case": "智能监控系统",
    },
]

for scenario in application_scenarios:
    print(f"\n🚀 {scenario['name']}")
    print(f"   推荐模型: {model_configs[scenario['model']]['name']}")
    print(f"   关键需求: {', '.join(scenario['requirements'])}")
    print(f"   应用案例: {scenario['use_case']}")

# 7. 高级优化技术
print("\n⚡ 高级优化技术")
print("-" * 40)

optimization_techniques = [
    {
        "name": "模型量化 (Quantization)",
        "benefit": "模型大小减少75%，推理速度提升2-4倍",
        "trade_off": "精度轻微下降(1-2%)",
    },
    {
        "name": "模型剪枝 (Pruning)",
        "benefit": "移除冗余参数，减少计算量",
        "trade_off": "需要重新训练微调",
    },
    {
        "name": "知识蒸馏 (Knowledge Distillation)",
        "benefit": "小模型学习大模型知识",
        "trade_off": "训练过程更复杂",
    },
    {
        "name": "动态推理 (Dynamic Inference)",
        "benefit": "根据输入复杂度调整计算",
        "trade_off": "实现复杂度较高",
    },
]

for tech in optimization_techniques:
    print(f"\n🔧 {tech['name']}")
    print(f"   优势: {tech['benefit']}")
    print(f"   权衡: {tech['trade_off']}")

# 8. 部署建议
print("\n🚀 部署建议")
print("-" * 40)

deployment_options = {
    "云端部署": {
        "platforms": ["AWS SageMaker", "Google Cloud AI", "Azure ML"],
        "advantages": ["高性能GPU", "弹性扩展", "托管服务"],
        "considerations": ["网络延迟", "数据传输成本"],
    },
    "边缘部署": {
        "platforms": ["NVIDIA Jetson", "Intel NCS", "Google Coral"],
        "advantages": ["低延迟", "数据隐私", "离线工作"],
        "considerations": ["硬件限制", "模型优化需求"],
    },
    "移动端部署": {
        "platforms": ["Core ML (iOS)", "TensorFlow Lite", "ONNX Runtime"],
        "advantages": ["用户体验好", "无网络依赖", "实时响应"],
        "considerations": ["模型大小限制", "电池消耗"],
    },
}

for deployment, details in deployment_options.items():
    print(f"\n📱 {deployment}")
    print(f"   平台: {', '.join(details['platforms'])}")
    print(f"   优势: {', '.join(details['advantages'])}")
    print(f"   考虑因素: {', '.join(details['considerations'])}")

# 9. 监控和维护
print("\n📊 生产环境监控")
print("-" * 40)

monitoring_metrics = [
    "🎯 模型准确率监控",
    "⏱️ 推理延迟跟踪",
    "💾 内存使用监控",
    "🔄 请求吞吐量统计",
    "❌ 错误率分析",
    "📈 数据漂移检测",
    "🔧 模型版本管理",
    "📝 预测结果审计",
]

for metric in monitoring_metrics:
    print(f"   {metric}")

# 10. 总结和最佳实践
print("\n✨ 最佳实践总结")
print("=" * 50)

best_practices = [
    "🎯 根据具体需求选择合适的模型架构",
    "📊 在真实数据上验证模型性能",
    "⚡ 使用适当的优化技术提升效率",
    "🔄 建立完善的模型更新流程",
    "📈 持续监控生产环境性能",
    "🛡️ 实施模型安全和隐私保护",
    "📝 维护详细的实验和部署文档",
    "🧪 定期进行A/B测试优化用户体验",
]

for practice in best_practices:
    print(f"   {practice}")

print(f"\n🎉 高级图像分类演示完成！")
print(f"⏰ 演示时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("🚀 您现在可以构建企业级的图像分类系统了！")
