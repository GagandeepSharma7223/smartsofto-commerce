using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Infrastructure.Identity;
using SmartSofto.Commerce.Infrastructure.Services;
using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly JwtService _jwtService;
        private readonly IEmailSender _emailSender;
        private readonly IConfiguration _configuration;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            JwtService jwtService,
            IEmailSender emailSender,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
            _emailSender = emailSender;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<ActionResult<LoginResponse>> Register(RegisterRequest request)
        {
            if (await _userManager.FindByEmailAsync(request.Email) != null)
            {
                return BadRequest("Email already exists");
            }

            if (await _userManager.FindByNameAsync(request.Username) != null)
            {
                return BadRequest("Username already exists");
            }

            var user = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                TenantId = request.TenantId ?? 1
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            string role = request.Role ?? "User";
            if (role != "Admin" && role != "User")
            {
                role = "User";
            }
            await _userManager.AddToRoleAsync(user, role);

            var roleName = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "User";
            var token = _jwtService.GenerateToken(user, roleName);

            return new LoginResponse
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? string.Empty,
                    Email = user.Email,
                    Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "User"
                }
            };
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            var user = await _userManager.FindByNameAsync(request.Username);

            if (user == null)
            {
                return Unauthorized("Invalid username or password");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);

            if (!result.Succeeded)
            {
                return Unauthorized("Invalid username or password");
            }

            var roleName = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "User";
            var token = _jwtService.GenerateToken(user, roleName);

            return new LoginResponse
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? string.Empty,
                    Email = user.Email,
                    Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "User"
                }
            };
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
        {
            // TODO: Add rate limiting (per IP/email) when middleware is available.
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return Ok(new { message = "If the account exists, a reset link has been sent." });
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user != null && user.IsActive)
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var frontendBase = _configuration["FrontendBaseUrl"] ?? "http://localhost:3000";
                var encodedEmail = WebUtility.UrlEncode(request.Email);
                var encodedToken = WebUtility.UrlEncode(token);
                var resetLink = $"{frontendBase}/reset-password?email={encodedEmail}&token={encodedToken}";

                await _emailSender.SendAsync(
                    request.Email,
                    "Reset your password",
                    $"Reset your password using this link: {resetLink}");
            }

            return Ok(new { message = "If the account exists, a reset link has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Token) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Email, token, and newPassword are required." });
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
            {
                return BadRequest(new { message = "Invalid reset request." });
            }

            var decodedToken = WebUtility.UrlDecode(request.Token);
            var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { message = "Password reset failed.", errors });
            }

            return Ok(new { message = "Password reset successful." });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "Logout successful" });
        }
    }
}
