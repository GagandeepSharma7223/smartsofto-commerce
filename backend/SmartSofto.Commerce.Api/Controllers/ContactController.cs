using System.Net;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Controllers
{
    [ApiController]
    [Route("contact")]
    public class ContactController : ControllerBase
    {
        private const string ContactRecipient = "smartsoftotechnologies@gmail.com";
        private readonly IEmailSender _emailSender;
        private readonly ILogger<ContactController> _logger;

        public ContactController(IEmailSender emailSender, ILogger<ContactController> logger)
        {
            _emailSender = emailSender;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ContactRequest request)
        {
            if (!string.IsNullOrWhiteSpace(request.Website))
            {
                return Ok(new { message = "Thanks for reaching out." });
            }

            var subject = $"New contact inquiry from {request.Name}";
            var body = BuildHtmlBody(request);

            try
            {
                await _emailSender.SendAsync(ContactRecipient, subject, body);
                return Ok(new { message = "Thanks for reaching out." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send contact email for {Email}", request.Email);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Unable to submit contact request right now."
                });
            }
        }

        private static string BuildHtmlBody(ContactRequest request)
        {
            var builder = new StringBuilder();
            builder.Append("<h2>New Contact Request</h2>");
            builder.Append("<table style=\"border-collapse:collapse;\">");
            AppendRow(builder, "Name", request.Name);
            AppendRow(builder, "Email", request.Email);
            AppendRow(builder, "Company", request.Company);
            AppendRow(builder, "Project Type", request.ProjectType);
            AppendRow(builder, "Project Stage", request.ProjectStage);
            AppendRow(builder, "Budget", request.Budget);
            AppendRow(builder, "Timeline", request.Timeline);
            AppendRow(builder, "Project Details", request.ProjectDetails);
            builder.Append("</table>");
            return builder.ToString();
        }

        private static void AppendRow(StringBuilder builder, string label, string? value)
        {
            var encodedValue = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(value) ? "-" : value);
            builder.Append("<tr>");
            builder.Append($"<td style=\"padding:6px 12px 6px 0;font-weight:bold;vertical-align:top;\">{WebUtility.HtmlEncode(label)}</td>");
            builder.Append($"<td style=\"padding:6px 0;white-space:pre-wrap;\">{encodedValue}</td>");
            builder.Append("</tr>");
        }
    }
}
