using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using SmartSofto.Commerce.Api.Controllers;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Tests
{
    public class ContactControllerTests
    {
        [Fact]
        public async Task Create_Sends_Email_And_Returns_Ok()
        {
            var sender = new FakeEmailSender();
            var controller = new ContactController(sender, NullLogger<ContactController>.Instance);

            var result = await controller.Create(new ContactRequest
            {
                Name = "Jane Smith",
                Email = "jane@example.com",
                Company = "Example Company",
                ProjectType = "E-commerce platform",
                ProjectStage = "Early idea",
                Budget = "$25,000-$50,000",
                Timeline = "Within 3-6 months",
                ProjectDetails = "We need an online ordering platform connected to inventory and delivery.",
                Website = string.Empty
            });

            var ok = Assert.IsType<OkObjectResult>(result);
            var sentMessage = Assert.Single(sender.SentMessages);
            Assert.Equal("smartsoftotechnologies@gmail.com", sentMessage.ToEmail);
            Assert.Equal(200, ok.StatusCode ?? 200);
        }

        [Fact]
        public async Task Create_With_Honeypot_Does_Not_Send_Email()
        {
            var sender = new FakeEmailSender();
            var controller = new ContactController(sender, NullLogger<ContactController>.Instance);

            var result = await controller.Create(new ContactRequest
            {
                Name = "Bot",
                Email = "bot@example.com",
                ProjectType = "Spam",
                ProjectStage = "Spam",
                Budget = "Spam",
                Timeline = "Spam",
                ProjectDetails = "Spam",
                Website = "https://spam.example.com"
            });

            Assert.IsType<OkObjectResult>(result);
            Assert.Empty(sender.SentMessages);
        }

        private sealed class FakeEmailSender : IEmailSender
        {
            public List<(string ToEmail, string Subject, string HtmlBody)> SentMessages { get; } = [];

            public Task SendAsync(string toEmail, string subject, string htmlBody)
            {
                SentMessages.Add((toEmail, subject, htmlBody));
                return Task.CompletedTask;
            }
        }
    }
}
