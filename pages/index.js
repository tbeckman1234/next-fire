import { useState } from 'react'
import { firestore, fromMillis, postToJSON } from '../lib/firebase'

// components
import Loader from '../components/Loader'
import PostFeed from '../components/PostFeed'

// styles & images
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Link from 'next/link'

// libraries
import toast from 'react-hot-toast'

// Max post to query per page
const LIMIT = 10

export async function getServerSideProps(context) {
  const postsQuery = firestore
    .collectionGroup('posts')
    .where('published', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(LIMIT)

    const posts = (await postsQuery.get()).docs.map(postToJSON)

    return {
      props: { posts }, // will be passed to the page component as props
    }
}

export default function Home(props) {
  const [posts, setPosts] = useState(props.posts)
  const [loading, setLoading] = useState(false)

  const [postsEnd, setPostsEnd] = useState(false)

  const getMorePosts = async () => {
    setLoading(true)
    const last = posts[posts.length -1]

    const cursor = typeof last.createdAt === 'number' ? fromMillis(last.createdAt) : last.createdAt

    const query = firestore
      .collectionGroup('posts')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc')
      .startAfter(cursor)
      .limit(LIMIT)

      const newPosts = (await query.get()).docs.map((doc) => doc.data())

      setPosts(posts.concat(newPosts))
      setLoading(false)

      if (newPosts.length < LIMIT) {
        setPostsEnd(true)
      }

  }

  return (
    <main>
      <PostFeed posts={posts} />

      {!loading && !postsEnd && <button onClick={getMorePosts}>Load more</button>}

      <Loader show={loading} />

      {postsEnd && 'You have reached the end!'}
    </main>
  )
}
