using Microsoft.AspNetCore.Identity;

namespace backend.Models
{
    public static class AuthIdentityGenerator
    {
        public static async Task GenerateDefaultIdentityAsync(
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            try
            {
                await SeedAsync(serviceProvider, configuration);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Seeder failed (non-fatal): {ex.Message}");
            }
        }

        private static async Task SeedAsync(
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            Console.WriteLine("Seeder started");

            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            Console.WriteLine("Managers resolved");

            foreach (var roleName in new[]
                     {
                         AuthRoles.Admin,
                         AuthRoles.User,
                         AuthRoles.Donor,
                         AuthRoles.Staff
                     })
            {
                Console.WriteLine($"Checking role: {roleName}");

                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    Console.WriteLine($"Creating role: {roleName}");

                    var createRoleResult = await roleManager.CreateAsync(new IdentityRole(roleName));

                    if (!createRoleResult.Succeeded)
                    {
                        throw new Exception(
                            $"Failed to create role '{roleName}': " +
                            string.Join(", ", createRoleResult.Errors.Select(e => e.Description)));
                    }
                }
            }

            Console.WriteLine("Roles complete");

            var adminSection = configuration.GetSection("GenerateDefaultIdentityAdmin");
            var adminEmail = adminSection["Email"];
            var adminPassword = adminSection["Password"];

            Console.WriteLine($"Admin email present: {!string.IsNullOrWhiteSpace(adminEmail)}");
            Console.WriteLine($"Admin password present: {!string.IsNullOrWhiteSpace(adminPassword)}");

            if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
            {
                Console.WriteLine("Skipping admin creation");
                return;
            }

            Console.WriteLine("Looking up admin user");
            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                Console.WriteLine("Creating admin user");

                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true
                };

                var createAdminResult = await userManager.CreateAsync(adminUser, adminPassword);

                if (!createAdminResult.Succeeded)
                {
                    throw new Exception(
                        "Failed to create admin user: " +
                        string.Join(", ", createAdminResult.Errors.Select(e => e.Description)));
                }
            }

            Console.WriteLine("Checking admin role assignment");

            if (!await userManager.IsInRoleAsync(adminUser, AuthRoles.Admin))
            {
                Console.WriteLine("Assigning admin role");

                var addToRoleResult = await userManager.AddToRoleAsync(adminUser, AuthRoles.Admin);

                if (!addToRoleResult.Succeeded)
                {
                    throw new Exception(
                        "Failed to assign admin role: " +
                        string.Join(", ", addToRoleResult.Errors.Select(e => e.Description)));
                }
            }

            Console.WriteLine("Seeder finished");
        }
    }
}
