// define the queries , mutations , types to work with in graphql service 
const { buildSchema } = require('graphql')

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }

    type AuthData {
        token : String
        userId : String
    }

    type PostsData {
        posts: [Post!]!
        totalItems: Int!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
        updatePost(postId: ID!, postInput: PostInputData): Post!
        deletePost(postId: ID!): Boolean
    }

    type RootQuery {
        login(email: String!, password: String!) : AuthData!
        getPosts(page: Int!): PostsData
        getPost(postId: ID!): Post!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)

// ! = required
// input = special keyword for data that be used as an input

/**
 * lợi thế : lấy đúng dữ liệu mk cần từ 1 endpoint thay vì tạo nhiều endpoint cho việc lấy riêng những đặc điểm khác nhau từ cùng 1 object
 * Nghĩ lại thì ,
 * Lúc GET ở file chung bên fe lấy nguyên cái object đó rồi lưu vào state là đc mà 
 * Đoạn nào cần dữ liệu thì lấy data từ state đó ra lol
 * mỗi tội triển khai bên fe thế thì ko đảm bảo phần security
 */