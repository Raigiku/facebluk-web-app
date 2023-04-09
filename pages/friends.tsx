import NavBar from "@/components/navbar";
import Image from "next/image";
import { ReactElement } from "react";
import { NextPageWithLayout } from "./_app";

const FriendsPage: NextPageWithLayout = () => {
  return (
    <div className="flex-1 flex flex-col p-8">
      <div>
        <h1 className="text-xl font-medium">Friend Requests</h1>
      </div>
      <div>
        <h1 className="text-xl font-medium">Friends</h1>
        <div className="grid grid-cols-4 gap-4">
          {friends.map((x) => (
            <div key={x.userId} className="flex flex-col items-center justify-end">
              <Image
                className="rounded-full"
                src={x.image.url}
                alt={x.name}
                width={x.image.width}
                height={x.image.height}
              />
              <div>{x.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;

FriendsPage.getLayout = (page: ReactElement) => {
  return (
    <>
      <NavBar />
      {page}
    </>
  );
};

type Friend = {
  userId: string;
  image: {
    url: string;
    width: number;
    height: number;
  };
  name: string;
};

const friends: Friend[] = [
  {
    userId: "1",
    name: "Brunella Martin Laos",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/A-Cat.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "2",
    name: "Arturo Campos Mata",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/Adorable-animal-cat-20787.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "3",
    name: "Fabio Canta",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/June_odd-eyed-cat.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "4",
    name: "Brunella Martin Laos",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/A-Cat.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "5",
    name: "Arturo Campos Mata",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/Adorable-animal-cat-20787.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "6",
    name: "Fabio Canta",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/June_odd-eyed-cat.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "7",
    name: "Brunella Martin Laos",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/A-Cat.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "8",
    name: "Arturo Campos Mata",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/Adorable-animal-cat-20787.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "9",
    name: "Fabio Canta",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/June_odd-eyed-cat.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "10",
    name: "Brunella Martin Laos",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/A-Cat.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "11",
    name: "Arturo Campos Mata",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/Adorable-animal-cat-20787.jpg",
      height: 200,
      width: 200,
    },
  },
  {
    userId: "12",
    name: "Fabio Canta",
    image: {
      url: "https://vonpqjzllgoreuqgtkyf.supabase.co/storage/v1/object/public/test-pics/June_odd-eyed-cat.jpg",
      height: 200,
      width: 200,
    },
  },
];
