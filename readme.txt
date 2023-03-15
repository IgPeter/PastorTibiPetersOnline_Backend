Was supposed to be a Graphql server. Now it will be a REST API server.

Below are the  abstracted graphql server code

future update will see a migration to graphql.


const messages = []

app.use('/api', graphqlHTTP({
    schema: buildSchema(`

        type Message {
            _id: ID!
            title: String!
            type: String!
            description: String!
            imageUrl: String!
            messageUrl: String!
        }

        input MessageInput {
            title: String!
            description: String!
            imageUrl: String!
            messageUrl: String!
        }

        type rootQuery {
            messages: [Message!]!
        }   

        type rootMutation {
            createMessages(messageInput: MessageInput): Message  
        }

        schema {
            query: rootQuery
            mutation: rootMutation
        } 
    `),
    
    rootValue: {

        messages: () => {
            return messages;
        },

        createMessages: (args) => {
            const message = {
                _id: Math.random.toString(),
                title: args.messageInput.title,
                description: args.messageInput.description,
                imageUrl: args.messageInput.imageUrl,
                messageUrl: args.messageInput.messageUrl
            }

            messages.push(message);
            return message;
        }
    },

    graphiql: true
}));