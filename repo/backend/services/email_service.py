import aiosmtplib
from email.message import EmailMessage
from typing import List, Dict, Any
from datetime import datetime
from ..config import settings


class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD

    async def send_training_report(
        self,
        recipients: List[str],
        session_data: Dict[str, Any],
        dog_data: Dict[str, Any],
        handler_data: Dict[str, Any],
        improvement_plan: str,
        evaluation_scores: Dict[str, Any],
        include_transcription: bool = False,
        transcription: str = ""
    ) -> Dict[str, Any]:
        if not self.username or not self.password:
            return {
                "success": False,
                "sent_count": 0,
                "failed_count": len(recipients),
                "errors": ["SMTP credentials not configured"]
            }
        
        dog_name = dog_data.get('name', '搜救犬')
        session_title = session_data.get('title', '训练复盘')
        session_date = session_data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        subject = f"【训练报告】{dog_name} - {session_title} - {session_date}"
        
        html_body = self._generate_html_body(
            session_data, dog_data, handler_data,
            improvement_plan, evaluation_scores,
            include_transcription, transcription
        )
        
        sent_count = 0
        failed_count = 0
        errors = []
        
        for recipient in recipients:
            try:
                msg = EmailMessage()
                msg["From"] = self.username
                msg["To"] = recipient
                msg["Subject"] = subject
                msg.set_content(html_body, subtype="html")
                
                await aiosmtplib.send(
                    msg,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    username=self.username,
                    password=self.password,
                    use_tls=True
                )
                sent_count += 1
            except Exception as e:
                failed_count += 1
                errors.append(f"{recipient}: {str(e)}")
        
        return {
            "success": failed_count == 0,
            "sent_count": sent_count,
            "failed_count": failed_count,
            "errors": errors
        }

    def _generate_html_body(
        self,
        session_data: Dict[str, Any],
        dog_data: Dict[str, Any],
        handler_data: Dict[str, Any],
        improvement_plan: str,
        evaluation_scores: Dict[str, Any],
        include_transcription: bool,
        transcription: str
    ) -> str:
        scores_html = ""
        for criterion, data in evaluation_scores.items():
            if isinstance(data, dict):
                score = data.get('score', 'N/A')
                notes = data.get('notes', '')
                scores_html += f"""
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">{criterion}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">{score}/10</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{notes}</td>
                </tr>
                """
        
        improvement_html = improvement_plan.replace('\n', '<br>').replace('# ', '<h3>').replace('## ', '<h4>').replace('### ', '<h5>').replace('- ', '• ')
        
        transcription_html = ""
        if include_transcription and transcription:
            transcription_html = f"""
            <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                <h3 style="color: #333;">📝 会议转录</h3>
                <p style="white-space: pre-wrap; line-height: 1.6;">{transcription}</p>
            </div>
            """
        
        html = f"""
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 30px; background-color: #ffffff; }}
                .info-card {{ background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background-color: #1e3a5f; color: white; padding: 12px; text-align: left; }}
                .footer {{ margin-top: 30px; padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }}
                .badge {{ display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
                .badge-success {{ background-color: #d4edda; color: #155724; }}
                .badge-warning {{ background-color: #fff3cd; color: #856404; }}
                h3 {{ color: #1e3a5f; border-bottom: 2px solid #e3e3e3; padding-bottom: 10px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐕 搜救犬训练复盘报告</h1>
                <p>灾害搜救犬训练评估与改进方案</p>
            </div>
            
            <div class="content">
                <div class="info-card">
                    <h3>📋 基本信息</h3>
                    <p><strong>训练名称:</strong> {session_data.get('title', '')}</p>
                    <p><strong>训练日期:</strong> {session_data.get('date', '')}</p>
                    <p><strong>训练地点:</strong> {session_data.get('location', '')}</p>
                    <p><strong>场景类型:</strong> <span class="badge badge-success">{session_data.get('scenario_type', '')}</span></p>
                    <p><strong>难度等级:</strong> <span class="badge badge-warning">{session_data.get('difficulty_level', '')}</span></p>
                </div>
                
                <div class="info-card">
                    <h3>🐕 犬只信息</h3>
                    <p><strong>犬名:</strong> {dog_data.get('name', '')}</p>
                    <p><strong>品种:</strong> {dog_data.get('breed', '')}</p>
                    <p><strong>年龄:</strong> {dog_data.get('age', '')} 岁</p>
                    <p><strong>训练等级:</strong> {dog_data.get('training_level', '')}</p>
                    <p><strong>训导员:</strong> {handler_data.get('name', '')}</p>
                </div>
                
                <h3>📊 评估成绩</h3>
                <table>
                    <thead>
                        <tr>
                            <th>评估项目</th>
                            <th style="width: 100px;">得分</th>
                            <th>说明</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scores_html}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px;">
                    <h3>🎯 训练改进方案</h3>
                    <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                        {improvement_html}
                    </div>
                </div>
                
                {transcription_html}
            </div>
            
            <div class="footer">
                <p>📧 此邮件由搜救犬训练管理系统自动发送</p>
                <p>© 2024 K9 Search Rescue Training System</p>
            </div>
        </body>
        </html>
        """
        
        return html


email_service = EmailService()
