<?php

$server = $_SERVER['SERVER_ADDR'];
$domain = $_SERVER['SERVER_NAME'];
$page   = $_SERVER['SCRIPT_NAME'];

if (isset($_SESSION['userid'])) {
    $userID = $_SESSION['userid'];
}
else {
    $userID = rand(1111111,9999999);
    $_SESSION['userid'] = $userID;
}
?>
<script>
    var digitalData = digitalData || {};
    digitalData = {
        site: {
            domain: "<?php echo $domain; ?>",
            anonymousUserId: "<?php echo $userID; ?>",
            server: "<?php echo $server; ?>",
        },    
        page: {
            pageName: document.title,
            siteSection: "",
        },
        product: {
            productEvent: "",
            productID: "",
            productName: ""
        }
    };
</script>