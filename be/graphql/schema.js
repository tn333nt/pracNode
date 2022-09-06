// define the queries , mutations , types to work with in graphql service 
const { buildSchema } = require('graphql')

module.exports = buildSchema(`
    type ReturnedDataAfterMutate {
        _id: ID!
        name: String
        email: String
        password: String
        status: String
    }

    input argDataType {
        email: String!
        name: String!
        password: String!
    }

    type RootMutation {
        mutationName(argForResolvers: argDataType): ReturnedDataAfterMutate!
    }

    type RootQuery {
        abc: String!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)

// ! = required
// input = special keyword for data that be used as an input