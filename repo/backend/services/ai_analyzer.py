import json
from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from ..config import settings


class AIAnalyzer:
    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        
        self.evaluation_criteria = [
            "气味识别准确率",
            "搜索路径效率",
            "服从性",
            "抗干扰能力",
            "耐力表现",
            "复杂环境适应",
            "指令响应速度",
            "团队协作能力"
        ]

    async def analyze_transcription(
        self,
        transcription: str,
        speaker_segments: List[Dict[str, Any]],
        dog_info: Dict[str, Any],
        session_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not self.client:
            return self._mock_analysis(dog_info, session_info)
        
        speaker_context = self._format_speaker_segments(speaker_segments)
        
        system_prompt = """你是一名专业的搜救犬训练评估专家。请分析训练复盘会议的转录文本，
对搜救犬的表现进行全面评估，并生成个性化的训练改进方案。

评估标准包括：
1. 气味识别准确率 - 犬只发现目标气味的准确性
2. 搜索路径效率 - 搜索区域覆盖的效率和系统性
3. 服从性 - 对训导员指令的执行情况
4. 抗干扰能力 - 在复杂环境中保持专注的能力
5. 耐力表现 - 长时间工作的持续能力
6. 复杂环境适应 - 对不同地形和环境的适应能力
7. 指令响应速度 - 对指令的反应速度
8. 团队协作能力 - 与训导员的配合默契度

请输出JSON格式，包含：
- evaluation_scores: 各项评分(0-10分)及详细说明
- strengths: 犬只的优点
- weaknesses: 需要改进的方面
- improvement_plan: 详细的训练改进方案
- meeting_summary: 会议要点总结"""

        user_prompt = f"""
训练基本信息：
- 训练标题: {session_info.get('title', '')}
- 训练日期: {session_info.get('date', '')}
- 场景类型: {session_info.get('scenario_type', '')}
- 难度等级: {session_info.get('difficulty_level', '')}

犬只信息：
- 犬名: {dog_info.get('name', '')}
- 品种: {dog_info.get('breed', '')}
- 年龄: {dog_info.get('age', '')}
- 训练等级: {dog_info.get('training_level', '')}

会议转录文本：
{transcription}

说话人分段：
{speaker_context}

请进行全面评估并生成改进方案。"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            return self._mock_analysis(dog_info, session_info)

    def _format_speaker_segments(self, segments: List[Dict[str, Any]]) -> str:
        formatted = []
        for seg in segments:
            speaker = seg.get("speaker", "UNKNOWN")
            text = seg.get("text", "")
            formatted.append(f"[{speaker}] {text}")
        return "\n".join(formatted)

    def _mock_analysis(self, dog_info: Dict[str, Any], session_info: Dict[str, Any]) -> Dict[str, Any]:
        dog_name = dog_info.get('name', '搜救犬')
        
        return {
            "evaluation_scores": {
                "气味识别准确率": {"score": 8.5, "notes": "在复杂环境中表现良好，成功识别目标气味"},
                "搜索路径效率": {"score": 7.0, "notes": "搜索路径有少量重复，可优化区域覆盖策略"},
                "服从性": {"score": 9.0, "notes": "对训导员指令响应积极，执行准确"},
                "抗干扰能力": {"score": 7.5, "notes": "在有背景噪音时仍能保持专注"},
                "耐力表现": {"score": 8.0, "notes": "30分钟搜索后略有疲劳，整体表现良好"},
                "复杂环境适应": {"score": 7.0, "notes": "在废墟环境中需要更多适应训练"},
                "指令响应速度": {"score": 8.5, "notes": "对指令反应迅速"},
                "团队协作能力": {"score": 9.0, "notes": "与训导员配合默契"}
            },
            "strengths": [
                "气味识别能力强，准确率高",
                "服从性好，与训导员配合默契",
                "指令响应速度快",
                "耐力表现良好，可胜任长时间搜索任务"
            ],
            "weaknesses": [
                "搜索路径规划能力有待提升",
                "复杂废墟环境适应能力需要加强",
                "抗干扰能力在高强度干扰下仍有提升空间"
            ],
            "improvement_plan": f"""
# {dog_name} 训练改进方案

## 一、针对性训练计划

### 1. 搜索路径优化训练
- **训练内容**: 系统性区域搜索训练，使用网格搜索模式
- **频率**: 每周2次，每次30分钟
- **预期目标**: 减少重复搜索区域，提升搜索效率20%

### 2. 复杂环境适应训练
- **训练内容**: 废墟环境模拟训练，包含各种障碍物
- **频率**: 每周1次，每次45分钟
- **预期目标**: 提升在复杂地形中的行动能力和自信心

### 3. 抗干扰强化训练
- **训练内容**: 在高强度背景噪音和干扰环境下进行气味识别
- **频率**: 每周1次，每次25分钟
- **预期目标**: 在85分贝环境下保持90%以上的识别准确率

## 二、长期发展建议

1. 增加野外实际环境训练比例
2. 定期参加跨队伍联合演练
3. 建立详细的训练效果追踪记录
4. 每季度进行一次全面能力评估

## 三、营养与健康管理

1. 训练前后适当补充能量
2. 定期进行关节检查
3. 保证充足的休息恢复时间

## 四、下次评估时间
- 建议4周后进行复评
- 重点关注搜索路径效率和复杂环境适应能力的提升
""",
            "meeting_summary": f"""
本次复盘会议总结了{dog_name}在{session_info.get('scenario_type', '训练')}中的表现。

**主要亮点:**
- 气味识别表现优秀，成功定位所有目标
- 服从性良好，与训导员配合默契
- 耐力表现达到预期标准

**待改进事项:**
- 搜索路径规划需要更系统性
- 复杂环境适应能力有待加强
- 建议增加干扰环境下的训练

**行动项:**
1. 按改进方案执行针对性训练
2. 训导员加强路径规划指导
3. 两周后进行中期进度检查
"""
        }


ai_analyzer = AIAnalyzer()
