import React, { Component, Fragment } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false, // is open modal (all)
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '', // input text
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {
    fetch('http://localhost:8080/graphql')
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) {
          throw new Error('Failed to fetch user status.');
        }
        this.setState({ status: resData.data.getPosts.status });
      })
      .catch(this.catchError);

    this.loadPosts();
  }

  // statusUpdateHandler = event => {
  //   event.preventDefault();
  //   fetch('URL')
  //     .then(res => {
  //       if (res.status !== 200 && res.status !== 201) {
  //         throw new Error("Can't update status!");
  //       }
  //       return res.json();
  //     })
  //     .then(resData => {
  //       console.log(resData);
  //     })
  //     .catch(this.catchError);
  // };

  // statusInputChangeHandler = (input, value) => {
  //   this.setState({ status: value });
  // };


  // fetch all
  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }

    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }
    // pass current page through argument of the query

    const gqlQuery = {
      query: `
        {
          getPosts(page: ${page}) {
            posts { _id title content imageUrl creator {name} createdAt}
            totalItems
          }
        }
      `
    }

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gqlQuery)
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) {
          throw new Error('Failed to fetch posts.');
        }

        this.setState({
          posts: resData.data.getPosts.posts.map(post => {
            return {
              ...post,
              imageUrl: post.imageUrl
            }
          }),
          totalPosts: resData.data.getPosts.totalItems,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };


  // open post modal
  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  // open edit modal
  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };
      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  // post / edit 1
  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    // use for img (other data type) only
    const formData = new FormData();
    formData.append('imageUrl', postData.imageUrl);
    if (this.state.editPost) {
      formData.append('oldImage', this.state.editPost.imageUrl); // path of old img from the server
    }

    fetch('http://localhost:8080/postImg', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + this.props.token
      },
      body: formData // binary data
    })
      .then(res => res.json())
      .then(fileData => {
        const imageUrl = fileData.filePath
        let gqlQuery = {
          query: `
            mutation {
              createPost(postInput: {
                title: "${postData.title}", 
                content:"${postData.content}", 
                imageUrl: "${imageUrl}"
              }) {
                _id
                title
                content
                imageUrl
                creator {name}
                createdAt
              }
            }
          `
        }

        if (this.state.editPost) {
          gqlQuery = {
            query: `
              mutation {
                updatePost(
                  postId: "${this.state.editPost._id}",
                  postInput: {
                    title: "${postData.title}", 
                    content:"${postData.content}", 
                    imageUrl: "${imageUrl}"
                  }
                ) {
                  _id
                  title
                  content
                  imageUrl
                  creator {name}
                  createdAt
                }
              }
            `
          }
        }

        fetch('http://localhost:8080/graphql', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + this.props.token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gqlQuery),
        })

      })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) {
          throw new Error('Creating or editing a post failed!');
        }

        // {data: {createPost: {...}}}

        let resDataField = 'createPost'
        if (this.state.editPost) {
          resDataField = 'updatePost'
        }

        const post = {
          _id: resData.data[resDataField]._id,
          title: resData.data[resDataField].title,
          content: resData.data[resDataField].content,
          creator: resData.data[resDataField].creator,
          createdAt: resData.data[resDataField].createdAt,
          imageUrl: resData.data[resDataField].imageUrl,
        };

        this.setState(prevState => {
          // update new post + pagination immediately on ui
          let updatedPosts = [...prevState.posts]; // elements per page
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              p => p._id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
          } else {
            // updatedPosts.pop() // remove last element
            if (prevState.posts.length >= 2) {
              updatedPosts.pop();
            }
            updatedPosts.unshift(post) // add new one at the biginning
          }

          return {
            posts: updatedPosts,
            isEditing: false,
            editPost: null,
            editLoading: false
          };
        });

      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });

    const url = 'http://localhost:8080/graphql'
    const gqlQuery = {
      query: `
        mutation {
          deletePost(postId: "${postId}") 
        }
      `
    }

    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gqlQuery)
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) {
          throw new Error('Deleting a post failed!');
        }

        this.setState(prevState => {
          const updatedPosts = prevState.posts.filter(p => p._id !== postId);
          return { posts: updatedPosts, postsLoading: false };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        {/* <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section> */}
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
