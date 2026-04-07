<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recupere Sua Senha — Fatec-EJ</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8c 100%); color: #fff; padding: 40px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: .9; }
        .body { padding: 32px; color: #333; line-height: 1.6; }
        .message { font-size: 15px; margin-bottom: 24px; }
        .cta-button { display: inline-block; padding: 12px 32px; background: #1e3a5f; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
        .cta-button:hover { background: #2d5a8c; }
        .footer { background: #f4f4f4; padding: 16px 32px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 12px 16px; border-radius: 4px; margin-top: 16px; font-size: 12px; color: #856404; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🔐 Recupere Sua Senha</h1>
        <p>Painel Administrativo — Fatec-EJ</p>
    </div>
    <div class="body">
        <div class="message">
            <p>Olá,</p>
            <p>Recebemos um pedido para redefinir a sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{{ $resetLink }}" class="cta-button">Redefinir Minha Senha</a>
        </div>

        <p style="font-size: 13px; color: #666;">Ou copie e cole este link no seu navegador:<br><code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; word-break: break-all;">{{ $resetLink }}</code></p>

        <div class="warning">
            ⚠️ <strong>Este link expira em 60 minutos.</strong><br>
            Se você não solicitou uma redefinição de senha, ignore este e-mail.
        </div>
    </div>
    <div class="footer">
        Este é um e-mail automático, por favor não responda.<br>
        Fatec-EJ — {{ now()->format('d/m/Y H:i') }}
    </div>
</div>
</body>
</html>
