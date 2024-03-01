const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const config = require('./config.json');

// Create a new Discord client instance
const client = new Client({ intents: [Intents.ALL] });

const axios = require('axios');

// Define motivational messages
const motivationalMessages = [
    "You are capable of amazing things!",
    "Believe you can and you're halfway there.",
    "The only way to do great work is to love what you do.",
    "You are stronger than you think!",
    // more loading...
];

// Function to send a daily motivational message
function sendMotivationalMessage() {
    const channel = client.channels.cache.get('CHANNEL_ID_HERE'); // Replace 'CHANNEL_ID_HERE' with the ID of the channel where you want to send the message
    if (channel) {
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        channel.send(`${randomMessage}\n\nDo have a nice day everyone!`);
    }
}

// Schedule the function to run daily
setInterval(() => {
    // Get the current date and time
    const now = new Date();
    // Check if it's morning (e.g., 8:00 AM)
    if (now.getHours() === 8 && now.getMinutes() === 0) {
        sendMotivationalMessage();
    }
}, 60 * 1000); // Check every minute (adjust as needed)

client.on('ready', () => {
    console.log('Bot is ready!');
});


client.on('error', console.error);


// Set up a map to track message counts and warning counts for each user
const messageCounts = new Map();
// const messageCounts = new Map();
const warningCounts = new Map();
const frozenUsers = new Set();

// Function to check if a message is spam
function isSpam(message) {
    // Define spam threshold, warning threshold, and freeze threshold (adjust as needed)
    const spamThreshold = 5;
    const warningThreshold = 2;
    const freezeThreshold = 3;

    // Get the author of the message
    const authorId = message.author.id;

    // Check if the user is currently frozen
    if (frozenUsers.has(authorId)) {
        return true; // User is frozen, consider it as spam
    }

    // Increment message count for the author
    const currentCount = messageCounts.get(authorId) || 0;
    messageCounts.set(authorId, currentCount + 1);

    // Increment warning count for the author
    const currentWarnings = warningCounts.get(authorId) || 0;
    warningCounts.set(authorId, currentWarnings);

    // Check if message count exceeds the spam threshold
    if (currentCount >= spamThreshold) {
        // Check if warning count exceeds the warning threshold
        if (currentWarnings >= warningThreshold) {
            if (currentWarnings >= warningThreshold + freezeThreshold) {
                // User has exceeded the freeze threshold, kick the user
                kickUser(message.author);
            } else {
                // Freeze the user for 24 hours
                freezeUser(message.author);
                // Warn the user about the freeze
                warnUser(message.author, currentWarnings + 1, true);
            }
        } else {
            // Increment warning count
            warningCounts.set(authorId, currentWarnings + 1);
            // Warn the user
            warnUser(message.author, currentWarnings + 1, false);
        }
    }

    return false;
}

// Function to warn or freeze a user
function warnUser(user, warningNumber, isFrozen) {
    // Send a warning message to the user
    user.send(`This is warning number ${warningNumber}. Please refrain from spamming in the server.` +
              (isFrozen ? '\nYou have been frozen for 24 hours. Further spamming will result in a kick from the server.' : ''));
}

// Function to freeze a user for 24 hours
function freezeUser(user) {
    // Add the user to the frozen users set
    frozenUsers.add(user.id);
    // Schedule unfreezing after 24 hours
    setTimeout(() => {
        frozenUsers.delete(user.id);
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
}

// Function to kick a user from the server
async function kickUser(user) {
    try {
        // Fetch the member object corresponding to the user
        const member = await message.guild.members.fetch(user);

        // Kick the member from the server
        await member.kick('Spamming');

        // Log the action
        console.log(`Kicked user ${user.tag} for spamming.`);
    } catch (error) {
        // Log any errors that occur during the kicking process
        console.error(`Error kicking user ${user.tag}: ${error}`);
    }
}

client.on('guildMemberAdd', (member) => {
    const channel = member.guild.systemChannel;
    if (channel) {
        channel.send(`Welcome to the server, ${member}!`);
        member.send('Welcome to our server! Enjoy your stay.');
    }
});

// Set up a map to track message counts for each user

// Function to track message counts
client.on('message', (message) => {
    const userId = message.author.id;
    const currentCount = messageCounts.get(userId) || 0;
    messageCounts.set(userId, currentCount + 1);
});

// Function to reset message counts weekly
setInterval(() => {
    // Reset message counts every Sunday at midnight
    const now = new Date();
    if (now.getDay() === 0 && now.getHours() === 0 && now.getMinutes() === 0) {
        messageCounts.clear(); // Clear message counts
    }
}, 24 * 60 * 60 * 1000); // Check every 24 hours

// Function to get top message sender
function getTopMessageSender() {
    let topSender = { id: '', count: 0 };
    for (const [userId, count] of messageCounts) {
        if (count > topSender.count) {
            topSender = { id: userId, count: count };
        }
    }
    return topSender;
}

// Command to get top message sender
client.on('message', (message) => {
    if (message.content.startsWith('/topmessage')) {
        const topSender = getTopMessageSender();
        const user = client.users.cache.get(topSender.id);
        if (user) {
            message.channel.send(`The top message sender this week is ${user.tag} with ${topSender.count} messages.`);
        } else {
            message.channel.send('Unable to retrieve top message sender.');
        }
    }
});

client.on('message', (message) => {
    if (message.content.startsWith('/user')) {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.member(user);
        if (member) {
            message.channel.send(`User: ${user.tag}\nJoined: ${member.joinedAt}\nRoles: ${member.roles.cache.map(role => role.name).join(', ')}`);
        } else {
            message.channel.send('User not found.');
        }
    }
});

// Server Info Command
client.on('message', (message) => {
    if (message.content === '/server') {
        const guild = message.guild;
        if (guild) {
            message.channel.send(`Server Name: ${guild.name}\nCreated: ${guild.createdAt}\nDescription: ${guild.description}`);
        } else {
            message.channel.send('Server not found.');
        }
    }
});

// Track emoji reactions on messages
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.emoji.name === '❌' && reaction.count >= 5) {
        try {
            await reaction.message.delete();
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }
});


// Define Would You Rather questions
const wouldYouRatherQuestions = [
    "Would you rather have the ability to fly or breathe underwater?",
    "Would you rather be able to speak all languages or be able to communicate with animals?",
    // Add more questions as needed
];

// Command to start the game
client.on('message', (message) => {
    if (message.content === '/wyr') {
        // Select a random question
        const randomIndex = Math.floor(Math.random() * wouldYouRatherQuestions.length);
        const randomQuestion = wouldYouRatherQuestions[randomIndex];
        // Send the question to the channel
        message.channel.send(`**Would You Rather:**\n${randomQuestion}`);
    }
});

// Handle user responses
client.on('message', async (message) => {
    // Check if the message author is not a bot and the message content starts with '/wyr'
    if (!message.author.bot && message.content.toLowerCase().startsWith('/wyr')) {
        const question = message.content.substring(4).trim(); // Remove the '/wyr' command from the message
        const questionMessage = await message.channel.send(`**Would You Rather:**\n${question}`);

        // Add reaction options (thumbs up and thumbs down)
        await questionMessage.react('👍');
        await questionMessage.react('👎');

        // Create a reaction collector filter
        const filter = (reaction, user) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && !user.bot;
        };

        // Create a reaction collector
        const collector = questionMessage.createReactionCollector(filter, { time: 60000 }); // Collect reactions for 1 minute

        // Variables to track user choices
        let thumbsUpCount = 0;
        let thumbsDownCount = 0;

        collector.on('collect', (reaction) => {
            if (reaction.emoji.name === '👍') {
                thumbsUpCount++;
            } else if (reaction.emoji.name === '👎') {
                thumbsDownCount++;
            }
        });

        collector.on('end', () => {
            // Determine the most popular choice
            let result = '';
            if (thumbsUpCount > thumbsDownCount) {
                result = '👍';
            } else if (thumbsDownCount > thumbsUpCount) {
                result = '👎';
            } else {
                result = 'It\'s a tie!';
            }

            // Send the result to the channel
            message.channel.send(`The most popular choice is: ${result}`);
        });
    }
});

// Weather Command
client.on('message', async (message) => {
    if (message.content.startsWith('/weather')) {
        const location = message.content.substring(8).trim(); // Remove the '/weather' command from the message
        try {
            const apiKey = config.apiKey; // Access API key from config.json
            const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude={part}&appid={API key}&units=metric`;
            // Remaining code...
        } catch (error) {
            console.error('Error fetching weather information:', error);
            message.channel.send('An error occurred while fetching weather information.');
        }
    }
});

const puppeteer = require('puppeteer');

// Command to fetch answers from Google
// client.on('message', async (message) => {
//     if (message.content.startsWith('/google')) {
//         const query = message.content.substring(7).trim(); // Remove the '/google' command from the message
//         try {
//             const answer = await fetchGoogleAnswer(query);
//             if (answer) {
//                 message.channel.send(answer);
//             } else {
//                 message.channel.send('No answer found for the given query.');
//             }
//         } catch (error) {
//             console.error('Error fetching answer from Google:', error);
//             message.channel.send('An error occurred while fetching answer from Google.');
//         }
//     }
// });

// // Function to fetch answer from Google
// async function fetchGoogleAnswer(query) {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
//     const answerElement = await page.$('div[data-attrid="wa:/description"]');
//     const answer = answerElement ? await page.evaluate(el => el.textContent, answerElement) : null;
//     await browser.close();
//     return answer;
// }


// Command to fetch answers from DuckDuckGo
client.on('message', async (message) => {
    if (message.content.startsWith('/duckduckgo')) {
        const query = message.content.substring(12).trim(); // Remove the '/duckduckgo' command from the message
        try {
            const answer = await fetchDuckDuckGoAnswer(query);
            if (answer) {
                message.channel.send(answer);
            } else {
                message.channel.send('No answer found for the given query.');
            }
        } catch (error) {
            console.error('Error fetching answer from DuckDuckGo:', error);
            message.channel.send('An error occurred while fetching answer from DuckDuckGo.');
        }
    }
});

// Function to fetch answer from DuckDuckGo
async function fetchDuckDuckGoAnswer(query) {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    const response = await axios.get(url);
    const data = response.data;
    if (data.Answer) {
        return data.Answer;
    } else {
        return null;
    }
}

// Command to recommend movies
client.on('message', async (message) => {
    if (message.content.startsWith('/movie')) {
        const query = message.content.substring(7).trim(); // Remove the '/movie' command from the message
        try {
            const recommendations = await fetchMovieRecommendations(query);
            if (recommendations.length > 0) {
                message.channel.send('Here are some movie recommendations:');
                recommendations.forEach(movie => {
                    message.channel.send(`${movie.title} (${movie.release_date.substring(0, 4)}): ${movie.overview}`);
                });
            } else {
                message.channel.send('No movie recommendations found for the given query.');
            }
        } catch (error) {
            console.error('Error fetching movie recommendations:', error);
            message.channel.send('An error occurred while fetching movie recommendations.');
        }
    }
});

// Function to fetch movie recommendations
async function fetchMovieRecommendations(query) {
    const apiKey = config.apiKey; // Access API key from config.json
    const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;
    if (data.results && data.results.length > 0) {
        return data.results.slice(0, 5); // Return top 5 results
    } else {
        return [];
    }
}

client.login(config.token);