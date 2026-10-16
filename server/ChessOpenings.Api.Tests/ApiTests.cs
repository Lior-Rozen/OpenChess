using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ChessOpenings.Api.Tests;

public class ApiTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private record HelloResponse(string Message);

    [Fact]
    public async Task Hello_ReturnsHelloFriend()
    {
        var client = factory.CreateClient();

        var response = await client.GetFromJsonAsync<HelloResponse>("/api/hello");

        Assert.Equal("hello friend", response?.Message);
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
