using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Services
{
    public class DevEmailSender : IEmailSender
    {
        public Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            Console.WriteLine("[DevEmailSender] To: " + toEmail);
            Console.WriteLine("[DevEmailSender] Subject: " + subject);
            Console.WriteLine("[DevEmailSender] Body: " + htmlBody);
            return Task.CompletedTask;
        }
    }
}
