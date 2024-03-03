// Mock the Discord client and channel
const mockChannel = {
  send: jest.fn()
};
const mockClient = {
  channels: {
    cache: {
      get: jest.fn().mockReturnValue(mockChannel)
    }
  }
};

// Call the function
sendMotivationalMessage(mockClient);

// Verify that the channel.send method was called with the correct message
expect(mockChannel.send).toHaveBeenCalledWith(expect.stringContaining('Do have a nice day everyone!'));