import { PostModel } from "@/external-apis/read-store/post";
import AnonymousProfilePicture from "@/public/user-anonymous-profile.png";
import Image from "next/image";
import { useRouter } from "next/router";

type PostCardProps = {
  post: PostModel;
};

const PostCard = (props: PostCardProps) => {
  const router = useRouter();

  const profilePicture =
    props.post.user.profilePictureUrl ?? AnonymousProfilePicture;

  const onUserClicked = () => {
    router.push(`/profile/${props.post.user.alias}`);
  };

  return (
    <div className="card card-compact bg-base-100 shadow-md">
      <div className="card-body flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="avatar cursor-pointer" onClick={onUserClicked}>
            <div className="w-8 rounded-full">
              <Image
                alt={props.post.id}
                src={profilePicture}
                width={200}
                height={200}
              />
            </div>
          </div>
          <div
            className="self-center font-medium cursor-pointer"
            onClick={onUserClicked}
          >
            {props.post.user.name}
          </div>
        </div>

        <div>{props.post.description}</div>
      </div>
    </div>
  );
};

export default PostCard;
