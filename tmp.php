<?PHP
$username = $_POST['login'];
print md5($_GET['login']);
print $username;
echo '<a href="'.$username.'">link description</a>';
echo '<p>Hi you '.$username.'</p>';

?>
<title>Forms + <?PHP echo $username; ?></title>
<p>Hi there <?= $username ?></p>