import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { api } from '../../services/api';
import { format, parseISO } from  'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { convertDurationToTimeString } from '../../utils/convertDurationToTimeString';
import Image from 'next/image';
import Link from 'next/link';

import styles from './episode.module.scss';

type Episode = {
    id: string;
    title: string;
    thumbnail: string;
    members: string;
    duration: number;
    durationAsString: string;
    url: string;
    publishedAt: string;
    description: string;
}

type EpisodeProps = {
    episode: Episode;
}

export default function Episode({episode}: EpisodeProps){
    return(
        <div className={styles.episode}>
            <div className={styles.thumbnailContainer}>
                <Link href="/"><button type="button">
                    <img src="/arrow-left.svg" alt="Voltar"/>
                </button></Link>
                <Image 
                    width ={700} 
                    height={160} 
                    src={episode.thumbnail} 
                    objectFit="cover"
                />
                <button type="button">
                    <img src="/play.svg" alt="Tocar episódio"/>
                </button>
            </div>

            <header>
                <h1>{episode.title}</h1>
                <span>{episode.members}</span>
                <span>{episode.publishedAt}</span>
                <span>{episode.durationAsString}</span>
            </header>

            <div className={styles.description} dangerouslySetInnerHTML={{__html: episode.description}}/>
        </div>
    )
}

//Obrigatório ser usado em toda rota estatica que tem []
export const getStaticPaths: GetStaticPaths = async () => {
    const { data } = await api.get('episodes', {
        params: {
          _limit: 2,
          _sort: 'published_at',
          _order: 'desc'
        }
      })

      const paths = data.map(episode => {
          return{
              params: {
                  slug: episode.id
              }
          }
      })
    return{
        paths,
        fallback: 'blocking'//Determina o comportamento de uma página que não foi gerada de forma estática.
        //Se passado como false ele retorna um 404 caso a página não esteja nos paths.
        //Se passado como true se uma página for acessada e não foi gerada de forma estática.
        //ele vai buscar a página pra criar uma página estática em disco, isso acontece pelo lado do client.
        //Incremental Static Regeneration
    }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
    const { slug } = ctx.params;
    const { data } = await api.get(`/episodes/${slug}`);

    const episode = {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        members: data.members,
        publishedAt: format(parseISO(data.published_at), 'd MMM yy', {locale: ptBR}),
        duration: Number(data.file.duration),
        durationAsString: convertDurationToTimeString(Number(data.file.duration)),
        description: data.description,
        url: data.file.url
      }

    return {
        props: {
            episode
        },
        revalidate: 60 * 60 * 24, //24 hours
    }
}