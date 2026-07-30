using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Services
{
    public class NoOpEmailSender : IEmailSender
    {
        private readonly ILogger<NoOpEmailSender> _logger;

        public NoOpEmailSender(ILogger<NoOpEmailSender> logger)
        {
            _logger = logger;
        }

        public Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            _logger.LogWarning(
                "Email delivery skipped because SMTP is not configured. To={ToEmail}, Subject={Subject}",
                toEmail,
                subject);

            return Task.CompletedTask;
        }
    }
}
