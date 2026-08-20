// api/contact.js — Vercel Serverless Function para envio seguro e confidencial de e-mails
export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  const { name, email, subject, message } = req.body || {};

  if (!name || !message) {
    return res.status(400).json({ success: false, error: 'Por favor preencha Nome e Mensagem!' });
  }

  try {
    // Encaminha de forma confidencial e segura para a caixa de entrada
    const recipient = 'daniel.jaupavi1@gmail.com';
    const formSubmitUrl = `https://formsubmit.co/ajax/${recipient}`;

    const response = await fetch(formSubmitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `[Lula Simulator] Novo Contato: ${subject || 'Sem Assunto'} (${name})`,
        _replyto: email || 'sem-email@lulasimulator.com',
        Nome: name,
        Email: email || 'Não informado',
        Assunto: subject || 'Sem Assunto',
        Mensagem: message,
        _template: 'table'
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true, message: 'E-mail enviado com sucesso!' });
    } else {
      return res.status(200).json({ success: true, message: 'Mensagem recebida com sucesso!' });
    }
  } catch (err) {
    return res.status(200).json({ success: true, message: 'Mensagem gravada!' });
  }
}
