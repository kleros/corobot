const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
sgMail.setSubstitutionWrappers('{{', '}}')

module.exports = async ({ subject, message, chainId, chainName }) => {
  const emails = JSON.parse(process.env.WATCHERS)
  console.info('Sounding alarms!')

  for (const email of Object.keys(emails)) {
    const nickname = emails[email]
    console.info(`Sending out warning email to ${nickname} at ${email}`)
    sgMail.send({
      to: email,
      from: {
        email: process.env.FROM_ADDRESS,
        name: process.env.FROM_NAME
      },
      templateId: process.env.TEMPLATE_ID,
      dynamic_template_data: {
        subject,
        message: `${nickname}, ${message}`,
        uiPath: process.env.UI_PATH,
        chainName,
        chainId,
        governorAddr: process.env.GOVERNOR_ADDRESS
      }
    })
  }
  console.info('')
}
