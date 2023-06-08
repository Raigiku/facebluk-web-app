type ContentContainerProps = {
  children: React.ReactNode;
};

const ContentContainer = (props: ContentContainerProps) => {
  return (
    <div className="flex-1 flex flex-col mb-16 overflow-y-auto p-2">
      {props.children}
    </div>
  );
};

export default ContentContainer;
