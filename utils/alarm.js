const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
sgMail.setSubstitutionWrappers('{{', '}}')

module.exports = async ({
  subject,
  message,
  chainId,
  chainName,
  secondary
}) => {
  const emails = JSON.parse(process.env.WATCHERS)
  console.info('')
  console.info('Sounding alarms!')
  console.info('Subject:', subject)

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
        uiPath: process.env.GOVERNOR_URL,
        chainName,
        chainId,
        governorAddr: process.env.GOVERNOR_ADDRESS,
        secondary
      }
    })
  }
  console.info('')
}
